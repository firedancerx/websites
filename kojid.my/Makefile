.PHONY: install dev build fresh seed test horizon scheduler clean

# ── Setup ─────────────────────────────────────────────────────────────────────

install:
	composer install
	npm install
	cp -n .env.example .env || true
	php artisan key:generate
	@echo "✓ Dependencies installed. Edit .env then run: make fresh"

# ── Database ──────────────────────────────────────────────────────────────────

fresh:
	php artisan migrate:fresh --seed
	@echo "✓ Database reset and seeded."
	@echo "  Super Admin : superadmin@kojid.com.my / SuperAdmin@2026!"
	@echo "  Tenant Admin: admin@demo-trading.com.my / TenantAdmin@2026!"

migrate:
	php artisan migrate

seed:
	php artisan db:seed

rollback:
	php artisan migrate:rollback

# ── Assets ────────────────────────────────────────────────────────────────────

dev:
	npm run dev

build:
	npm run build

# ── Queue & Scheduler ─────────────────────────────────────────────────────────

horizon:
	php artisan horizon

queue:
	php artisan queue:work redis --queue=critical,default,notifications --tries=3

scheduler:
	php artisan schedule:work

# ── Testing ───────────────────────────────────────────────────────────────────

test:
	php artisan test

test-coverage:
	php artisan test --coverage

test-filter:
	php artisan test --filter=$(filter)

# ── Development utilities ─────────────────────────────────────────────────────

serve:
	php artisan serve

tinker:
	php artisan tinker

routes:
	php artisan route:list --columns=method,uri,name,action

cache-clear:
	php artisan cache:clear
	php artisan config:clear
	php artisan route:clear
	php artisan view:clear
	@echo "✓ All caches cleared."

optimize:
	php artisan config:cache
	php artisan route:cache
	php artisan view:cache
	php artisan event:cache
	@echo "✓ Application optimized for production."

telescope:
	php artisan telescope:install
	php artisan migrate

# ── Guillotina manual trigger (for testing) ───────────────────────────────────

guillotina:
	php artisan kojid:process-guillotina

sla-warnings:
	php artisan kojid:send-sla-warnings

# ── Code quality ─────────────────────────────────────────────────────────────

lint:
	./vendor/bin/pint

lint-check:
	./vendor/bin/pint --test

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -rf vendor node_modules
	rm -rf public/build
	rm -f .env
	@echo "✓ Project cleaned."

# ── Production deployment ─────────────────────────────────────────────────────

deploy:
	composer install --no-dev --optimize-autoloader
	npm ci
	npm run build
	php artisan migrate --force
	php artisan config:cache
	php artisan route:cache
	php artisan view:cache
	php artisan event:cache
	php artisan queue:restart
	@echo "✓ Production deployment complete."
