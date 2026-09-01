<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class BackupController extends Controller
{
    /**
     * Show backup dashboard.
     */
    public function index()
    {
        // Safety check: Only Super Admin or Master Tenant users can access backups
        $user = auth()->user();
        if (!$user->hasRole('super_admin') && $user->tenant_id !== 1) {
            abort(403, 'Akses dinafikan. Hanya Master Tenant boleh menguruskan sandaran.');
        }

        // List files in the storage/app/public/backups directory
        $disk = Storage::disk('public');
        if (!$disk->exists('backups')) {
            $disk->makeDirectory('backups');
        }

        $files = [];
        foreach ($disk->files('backups') as $file) {
            $files[] = [
                'name' => basename($file),
                'path' => $file,
                'size' => $this->formatBytes($disk->size($file)),
                'timestamp' => \Carbon\Carbon::createFromTimestamp($disk->lastModified($file)),
            ];
        }

        // Sort backups by latest first
        usort($files, fn($a, $b) => $b['timestamp']->timestamp <=> $a['timestamp']->timestamp);

        return view('admin.backups.index', compact('files'));
    }

    /**
     * Generate a new system and database backup ZIP.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasRole('super_admin') && $user->tenant_id !== 1) {
            abort(403);
        }

        // Ensure backups folder exists on the public disk
        $diskPath = storage_path('app/public/backups');
        if (!file_exists($diskPath)) {
            mkdir($diskPath, 0755, true);
        }
        $timestamp = now()->format('Ymd_His');
        $hasZip = class_exists('ZipArchive');

        // 1. Generate MySQL database dump if configured, otherwise pack SQLite file
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");
        $dbDumpFile = null;
        $sqliteDbFile = null;

        if ($dbConfig && $dbConfig['driver'] === 'mysql') {
            $host = $dbConfig['host'] ?? '127.0.0.1';
            $port = $dbConfig['port'] ?? '3306';
            $database = $dbConfig['database'] ?? '';
            $username = $dbConfig['username'] ?? '';
            $password = $dbConfig['password'] ?? '';

            $tempSqlFile = tempnam(sys_get_temp_dir(), 'kojid_sql_') . '.sql';

            $mysqldumpPath = 'mysqldump';
            if (PHP_OS_FAMILY === 'Windows') {
                $commonPaths = [
                    'C:\\Program Files\\MySQL\\MySQL Server 8.1\\bin\\mysqldump.exe',
                    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
                    'C:\\Program Files\\MySQL\\MySQL Server 8.2\\bin\\mysqldump.exe',
                    'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
                    'C:\\xampp\\mysql\\bin\\mysqldump.exe'
                ];
                foreach ($commonPaths as $path) {
                    if (file_exists($path)) {
                        $mysqldumpPath = '"' . $path . '"';
                        break;
                    }
                }
            }

            $cmd = sprintf(
                '%s --host=%s --port=%s --user=%s --password=%s %s > %s',
                $mysqldumpPath,
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database),
                escapeshellarg($tempSqlFile)
            );

            // Run command in background or suppress output warnings
            exec($cmd, $execOutput, $returnVar);

            if ($returnVar === 0 && file_exists($tempSqlFile) && filesize($tempSqlFile) > 0) {
                $dbDumpFile = $tempSqlFile;
            } else {
                if (file_exists($tempSqlFile)) {
                    unlink($tempSqlFile);
                }
            }
        } else {
            $dbPath = database_path('database.sqlite');
            if (file_exists($dbPath)) {
                $sqliteDbFile = $dbPath;
            }
        }

        if ($hasZip) {
            $zipFileName = "kojid_backup_{$timestamp}.zip";
            $zipFilePath = "{$diskPath}/{$zipFileName}";
            $zip = new ZipArchive();
            if ($zip->open($zipFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                // Pack database dump or SQLite file
                if ($dbDumpFile) {
                    $zip->addFile($dbDumpFile, 'database/database.sql');
                } elseif ($sqliteDbFile) {
                    $zip->addFile($sqliteDbFile, 'database/database.sqlite');
                }

                // 2. Pack configurations
                $configPath = base_path('config');
                if (file_exists($configPath)) {
                    $files = new \RecursiveIteratorIterator(
                        new \RecursiveDirectoryIterator($configPath),
                        \RecursiveIteratorIterator::LEAVES_ONLY
                    );

                    foreach ($files as $name => $file) {
                        if (!$file->isDir()) {
                            $filePath = $file->getRealPath();
                            $relativePath = 'config/' . substr($filePath, strlen($configPath) + 1);
                            $zip->addFile($filePath, $relativePath);
                        }
                    }
                }

                // 3. Pack .env file if it exists
                $envPath = base_path('.env');
                if (file_exists($envPath)) {
                    $zip->addFile($envPath, '.env');
                }

                $zip->close();
                $outputFileName = $zipFileName;
            } else {
                if ($dbDumpFile) {
                    unlink($dbDumpFile);
                }
                return back()->with('error', 'Gagal membina fail ZIP sandaran.');
            }
        } else {
            // Fallback to PharData (.tar.gz)
            $tarFileName = "kojid_backup_{$timestamp}.tar";
            $tarFilePath = "{$diskPath}/{$tarFileName}";
            $outputFileName = $tarFileName;

            try {
                $phar = new \PharData($tarFilePath);
                
                // Pack database dump or SQLite file
                if ($dbDumpFile) {
                    $phar->addFile($dbDumpFile, 'database/database.sql');
                } elseif ($sqliteDbFile) {
                    $phar->addFile($sqliteDbFile, 'database/database.sqlite');
                }

                // 2. Pack configurations
                $configPath = base_path('config');
                if (file_exists($configPath)) {
                    $files = new \RecursiveIteratorIterator(
                        new \RecursiveDirectoryIterator($configPath),
                        \RecursiveIteratorIterator::LEAVES_ONLY
                    );

                    foreach ($files as $name => $file) {
                        if (!$file->isDir()) {
                            $filePath = $file->getRealPath();
                            $relativePath = 'config/' . substr($filePath, strlen($configPath) + 1);
                            $phar->addFile($filePath, $relativePath);
                        }
                    }
                }

                // 3. Pack .env file if it exists
                $envPath = base_path('.env');
                if (file_exists($envPath)) {
                    $phar->addFile($envPath, '.env');
                }

                // Compress to gz if possible
                if (extension_loaded('zlib')) {
                    $phar->compress(\Phar::GZ);
                    if (file_exists($tarFilePath)) {
                        unlink($tarFilePath);
                    }
                    $outputFileName = "kojid_backup_{$timestamp}.tar.gz";
                }
            } catch (\Exception $e) {
                if (file_exists($tarFilePath)) {
                    unlink($tarFilePath);
                }
                if ($dbDumpFile) {
                    unlink($dbDumpFile);
                }
                return back()->with('error', 'Gagal membina fail sandaran (Phar): ' . $e->getMessage());
            }
        }

        // Cleanup temporary SQL dump file
        if ($dbDumpFile && file_exists($dbDumpFile)) {
            unlink($dbDumpFile);
        }

        return back()->with('success', "Sandaran sistem baharu berjaya dihasilkan: {$outputFileName}");
    }

    /**
     * Download specific backup file.
     */
    public function download(string $filename)
    {
        $user = auth()->user();
        if (!$user->hasRole('super_admin') && $user->tenant_id !== 1) {
            abort(403);
        }

        $path = "backups/{$filename}";
        if (!Storage::disk('public')->exists($path)) {
            abort(404, 'Fail sandaran tidak wujud.');
        }

        return Storage::disk('public')->download($path);
    }

    /**
     * Delete a backup file.
     */
    public function destroy(string $filename)
    {
        $user = auth()->user();
        if (!$user->hasRole('super_admin') && $user->tenant_id !== 1) {
            abort(403);
        }

        $path = "backups/{$filename}";
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return back()->with('success', 'Fail sandaran telah dipadamkan.');
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
