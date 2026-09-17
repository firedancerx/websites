-- MySQL dump 10.13  Distrib 8.0.29, for Win64 (x86_64)
--
-- Host: localhost    Database: foliodesk
-- ------------------------------------------------------
-- Server version	8.0.29

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `foliodesk`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `foliodesk` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `foliodesk`;

--
-- Table structure for table `affiliate_applications`
--

DROP TABLE IF EXISTS `affiliate_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliate_applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `application_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applicant_type` enum('INDIVIDUAL','COMPANY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_number` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `market_focus` enum('SINGAPORE','MALAYSIA','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `audience_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotion_method` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('SUBMITTED','UNDER_REVIEW','INFORMATION_REQUIRED','CORRECTION_REQUIRED','PENDING_MANAGEMENT_APPROVAL','APPROVED','REJECTED','SUSPENDED','TERMINATED','RETRACTED','RETRACTION_ACKNOWLEDGED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUBMITTED',
  `affiliate_code` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upline_affiliate_code` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_reviewer_id` bigint unsigned DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `decided_at` timestamp NULL DEFAULT NULL,
  `decision_note` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line3` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postcode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `town` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MYR',
  `id_doc_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `holding_id_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag_id_doc_unclear` tinyint(1) NOT NULL DEFAULT '0',
  `flag_holding_id_unaccepted` tinyint(1) NOT NULL DEFAULT '0',
  `is_test` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  UNIQUE KEY `affiliate_code` (`affiliate_code`),
  KEY `fk_application_user` (`user_id`),
  KEY `fk_application_reviewer` (`assigned_reviewer_id`),
  KEY `idx_application_status` (`status`),
  KEY `idx_application_submitted` (`submitted_at`),
  CONSTRAINT `fk_application_reviewer` FOREIGN KEY (`assigned_reviewer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_application_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliate_applications`
--

LOCK TABLES `affiliate_applications` WRITE;
/*!40000 ALTER TABLE `affiliate_applications` DISABLE KEYS */;
INSERT INTO `affiliate_applications` VALUES (1,2,'FDA-2026-E85EC1','INDIVIDUAL','flameaters.com','flameaters.com','MY','0197237962',NULL,NULL,'MALAYSIA','babab','bababab','APPROVED','FD-3E4E6962',NULL,1,'2026-08-07 14:03:38','2026-08-07 15:58:43','Approved. Your affiliate code is now active.','2026-09-10 10:37:01',NULL,NULL,NULL,NULL,NULL,NULL,'MYR',NULL,NULL,0,0,1),(2,3,'FDA-2026-21D739','INDIVIDUAL','Kemaman Engineering',NULL,'MY','0154224557',NULL,NULL,'MALAYSIA','Oil and gas in Kemaman','Contacts','SUSPENDED','FD-E1150F51',NULL,1,'2026-08-07 16:01:42','2026-08-11 14:22:24','Your affiliate application/account has been suspended.','2026-08-11 14:22:24',NULL,NULL,NULL,NULL,NULL,NULL,'MYR',NULL,NULL,0,0,1),(3,4,'FDA-2026-D765FA','INDIVIDUAL','PP Contract Supplies Sdn Bhd',NULL,'MY','0174224557',NULL,NULL,'MALAYSIA','Penang aviation contractors','Industry contacts','APPROVED','FD-B753FB4E',NULL,1,'2026-08-07 16:58:53','2026-08-07 18:26:43','Approved. Your affiliate code is now active.','2026-08-07 18:26:43',NULL,NULL,NULL,NULL,NULL,NULL,'MYR',NULL,NULL,0,0,1),(4,5,'FDA-2026-96D6B6','INDIVIDUAL','Southern Fabrications Sdn Bhd','x1234567y','MY','+60197237962',NULL,NULL,'MALAYSIA','Naval shipyard Johor','Through contacts','APPROVED','OGASCTQ2D',NULL,1,'2026-08-07 18:18:24','2026-08-07 18:21:31','Approved. Your affiliate code is now active.','2026-09-10 09:12:05','312 Selat Tebrau Road',NULL,NULL,'78000','Johor Bjaru','Johor','MYR','/foliodesk/uploads/id-documents/id_doc_1786126704236_4f7b182a.png','/foliodesk/uploads/id-documents/holding_id_1786126704291_5e8fd480.png',0,0,1),(5,6,'FDA-2026-01210D','INDIVIDUAL','East Coast Engineers Sdn Bhd',NULL,'MY','+60197237333',NULL,NULL,'MALAYSIA','Coastal MROs','Through friends','CORRECTION_REQUIRED','COTKK2BXV',NULL,1,'2026-08-07 18:25:45','2026-08-07 18:26:31','FolioDesk requires additional corrections or information regarding your identity documents or profile details.','2026-09-10 09:12:05','312 Selat Tebrau Road',NULL,NULL,'78000','Johor Bharu','Johor','MYR','/foliodesk/uploads/id-documents/id_doc_1786127145280_ea218967.png','/foliodesk/uploads/id-documents/holding_id_1786127145291_4a3485b5.png',0,0,1),(6,7,'FDA-2026-APEXEN','COMPANY','Apex Engineering Holdings Sdn Bhd','201801048821','MY','+60123456789',NULL,NULL,'BOTH','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','APEXENG99',NULL,NULL,'2026-08-11 18:50:04',NULL,NULL,'2026-08-11 18:50:04','Menara Apex, Level 18, Jalan Ampang',NULL,NULL,'50450','Kuala Lumpur','Wilayah Persekutuan Kuala Lumpur','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(7,8,'FDA-2026-SYNME0','COMPANY','Synergy M&E Solutions Sdn Bhd','202001019922','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','SYNME0001','APEXENG99',NULL,'2026-08-11 18:50:04',NULL,NULL,'2026-08-11 18:50:04','No 45, Jalan Industri PPU 3, Taman Puchong Utama',NULL,NULL,'47100','Puchong','Selangor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(8,9,'FDA-2026-KVALLE','COMPANY','Klang Valley Piping & Fittings Sdn Bhd','202103045511','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','KVALLEY01','SYNME0001',NULL,'2026-08-11 18:50:04',NULL,NULL,'2026-08-11 18:50:04','Lot 102, Kawasan Perindustrian Meru',NULL,NULL,'41050','Klang','Selangor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(9,10,'FDA-2026-SELCIV','COMPANY','Selangor Civil Works Services','202201088712','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','CORRECTION_REQUIRED','SELCIVIL1','SYNME0001',NULL,'2026-08-11 18:50:04',NULL,NULL,'2026-08-11 18:50:04','Unit 8-2, Wisma Civil, Seksyen 13',NULL,NULL,'40100','Shah Alam','Selangor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(10,11,'FDA-2026-PINSTE','COMPANY','Pinnacle Structural Steel Fab','201901033488','MY','+60123456789',NULL,NULL,'BOTH','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','PINSTEEL1','APEXENG99',NULL,'2026-08-11 18:50:04',NULL,NULL,'2026-08-11 18:50:04','Plot 44, Bukit Raja Industrial Park',NULL,NULL,'41200','Klang','Selangor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(11,12,'FDA-2026-BORNEO','COMPANY','Borneo Geotechnical Services','202002044811','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','BORNEOGEO','PINSTEEL1',NULL,'2026-08-11 18:50:04',NULL,NULL,'2026-08-11 18:50:04','Sublot 12, Demak Laut Industrial Estate',NULL,NULL,'93050','Kuching','Sarawak','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(12,13,'FDA-2026-BINATE','COMPANY','Bina Tech Infra Pte Ltd','201708892K','SG','+60123456789',NULL,NULL,'SINGAPORE','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','BINATECH88',NULL,NULL,'2026-08-11 18:50:04',NULL,NULL,'2026-08-11 18:50:04','12 Marina Boulevard, #24-01 Marina Bay Financial Centre',NULL,NULL,'018982','Singapore','Central Region','SGD','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(20,14,'FDA-2026-LIONGR','COMPANY','Lion City Power & Grid Pte Ltd','201912445E','SG','+60123456789',NULL,NULL,'SINGAPORE','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','LIONGRID1','BINATECH88',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','8 Kallang Avenue, #04-12 Aperia Tower 1',NULL,NULL,'339407','Singapore','Central Region','SGD','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(21,23,'FDA-2026-JURONG','COMPANY','Jurong Industrial Automation','202105891M','SG','+60123456789',NULL,NULL,'SINGAPORE','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','JURONGAUT','LIONGRID1',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','15 Pioneer Turn, #02-05',NULL,NULL,'627584','Singapore','West Region','SGD','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(22,24,'FDA-2026-TUASHV','COMPANY','Tuas High-Voltage Subcontractors','202018933R','SG','+60123456789',NULL,NULL,'SINGAPORE','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','TUASHV001','BINATECH88',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','28 Tuas South Avenue 8',NULL,NULL,'637648','Singapore','West Region','SGD','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(23,25,'FDA-2026-CHANGI','COMPANY','Changi MEP Consultants Pte Ltd','202209481W','SG','+60123456789',NULL,NULL,'SINGAPORE','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','SUBMITTED','CHANGIMEP','BINATECH88',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','5 Changi Business Park Central 1',NULL,NULL,'486038','Singapore','East Region','SGD','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(24,26,'FDA-2026-NANYAN','COMPANY','Nanyang Heavy Industries Corp','201601009923','MY','+60123456789',NULL,NULL,'BOTH','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','NANYANG77',NULL,NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','Wisma Nanyang, Suite 12-A, Jalan Skudai',NULL,NULL,'81200','Johor Bahru','Johor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(25,27,'FDA-2026-SOUTHR','COMPANY','Southern Railway Systems Sdn Bhd','201901044781','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','SOUTHRAIL','NANYANG77',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','No 18, Jalan Kempas Utama 3/1',NULL,NULL,'81300','Johor Bahru','Johor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(26,28,'FDA-2026-JOHORC','COMPANY','Johor Crane & Heavy Lift Operations','202101099234','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','JOHORCRAN','SOUTHRAIL',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','Plot 88, Pasir Gudang Industrial Estate',NULL,NULL,'81700','Pasir Gudang','Johor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(27,29,'FDA-2026-MELFAB','COMPANY','Melaka Marine Fabrication Ltd','201801088412','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','MELFAB001','NANYANG77',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','Jalan Tanjung Bruang, Hang Tuah Jaya',NULL,NULL,'75450','Melaka','Melaka','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(28,30,'FDA-2026-STRAIT','COMPANY','Straits Offshore Maintenance','202001077819','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','STRAITOFF','MELFAB001',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','No 5, Kawasan Perindustrian Cheng',NULL,NULL,'75250','Melaka','Melaka','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(29,31,'FDA-2026-BATUDO','COMPANY','Batu Pahat Dockyard Support','202203011488','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','BATUDOCK1','STRAITOFF',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','No 88, Jalan Tongkang Pechah',NULL,NULL,'83000','Batu Pahat','Johor','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(30,32,'FDA-2026-KUANTA','COMPANY','Kuantan Port Logistics Engineering','201901055811','MY','+60123456789',NULL,NULL,'MALAYSIA','Engineering contractors & EPC project leaders in Malaysia and Singapore.','Direct B2B referrals, industry seminars, and project partner introductions.','APPROVED','KUANTANLE','NANYANG77',NULL,'2026-08-11 18:54:30',NULL,NULL,'2026-08-11 18:54:30','Kuantan Port Industrial Zone, Gebeng',NULL,NULL,'26080','Kuantan','Pahang','MYR','/uploads/id-documents/sample_id.pdf','/uploads/id-documents/sample_holding.jpg',0,0,1),(31,33,'FDA-2026-7A30D5','COMPANY','Syarikat Usaha Maju','12344132441','ID','013-5557688',NULL,NULL,'MALAYSIA','Perak state','By mouth','RETRACTION_ACKNOWLEDGED','GLDFKYFLS',NULL,1,'2026-08-27 21:57:48','2026-08-30 09:25:12','Retraction acknowledged by superadmin. Profile is in read-only mode, and historical commissions for introductions made while active remain honored.','2026-09-10 09:12:05','33 USJ 11/3C',NULL,NULL,'47600','Subang Jaya','Central Java','IDR','/foliodesk/uploads/id-documents/id_doc_1787867868425_31ed9381.jpeg','/foliodesk/uploads/id-documents/holding_id_1787867868428_df56d11f.jpeg',0,0,1),(32,34,'FDA-2026-6296B3','COMPANY','Syarikat Kejuruteraan Hup Seng Sdn Bhd','16625243','MY','012-2332667',NULL,NULL,'MALAYSIA','Existing customers','Word of mouth and email','APPROVED','VY8PO3JXN',NULL,1,'2026-08-30 09:24:32','2026-08-30 09:25:39','Approved. Your affiliate code is now active.','2026-09-10 09:41:38','100 USJ Taipan 10.3C',NULL,NULL,'47600','Subang Jaya','Selangor','MYR','/foliodesk/uploads/id-documents/id_doc_1788079669118_582966db.pdf','/foliodesk/uploads/id-documents/holding_id_1788079669126_b6943d22.png',0,0,1),(33,37,'FDA-2026-79654C','INDIVIDUAL','Mohd Bashir Bin Harun','1524444355','MY','0123553456',NULL,NULL,'MALAYSIA','Pulau Pinang engineering firms','TikTok','APPROVED','DD5QXFBTO',NULL,1,'2026-09-04 16:09:37','2026-09-04 16:18:20','Approved. Your affiliate code is now active.','2026-09-10 09:12:05','105 USJ Taipan 10.3C',NULL,NULL,'47600','Subang Jaya','Selangor','MYR','/foliodesk/uploads/id-documents/id_doc_1788538176575_31057eb1.jpg','/foliodesk/uploads/id-documents/holding_id_1788538176578_c2dcf632.jpg',0,0,1);
/*!40000 ALTER TABLE `affiliate_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `affiliate_profile_updates`
--

DROP TABLE IF EXISTS `affiliate_profile_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliate_profile_updates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `application_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `status` enum('PENDING_APPROVAL','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_APPROVAL',
  `full_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applicant_type` enum('INDIVIDUAL','COMPANY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_number` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `town` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postcode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MYR',
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line3` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `market_focus` enum('SINGAPORE','MALAYSIA','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `audience_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotion_method` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doc_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `holding_id_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upline_affiliate_code` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_remarks` text COLLATE utf8mb4_unicode_ci,
  `reviewed_by_user_id` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_profile_update_user` (`user_id`),
  KEY `idx_profile_update_status` (`status`),
  KEY `idx_profile_update_app` (`application_id`),
  CONSTRAINT `fk_profile_update_app` FOREIGN KEY (`application_id`) REFERENCES `affiliate_applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profile_update_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliate_profile_updates`
--

LOCK TABLES `affiliate_profile_updates` WRITE;
/*!40000 ALTER TABLE `affiliate_profile_updates` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliate_profile_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_status_history`
--

DROP TABLE IF EXISTS `application_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_status_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `application_id` bigint unsigned NOT NULL,
  `from_status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` bigint unsigned DEFAULT NULL,
  `public_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_history_application` (`application_id`),
  KEY `fk_history_user` (`changed_by`),
  CONSTRAINT `fk_history_application` FOREIGN KEY (`application_id`) REFERENCES `affiliate_applications` (`id`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_status_history`
--

LOCK TABLES `application_status_history` WRITE;
/*!40000 ALTER TABLE `application_status_history` DISABLE KEYS */;
INSERT INTO `application_status_history` VALUES (1,1,NULL,'SUBMITTED',NULL,'Application received','2026-08-07 14:03:38'),(2,1,'SUBMITTED','UNDER_REVIEW',1,'Status changed to UNDER_REVIEW','2026-08-07 15:58:10'),(3,1,'UNDER_REVIEW','UNDER_REVIEW',1,'Status changed to UNDER_REVIEW','2026-08-07 15:58:15'),(4,1,'UNDER_REVIEW','INFORMATION_REQUIRED',1,'Status changed to INFORMATION_REQUIRED','2026-08-07 15:58:17'),(5,1,'INFORMATION_REQUIRED','UNDER_REVIEW',1,'Status changed to UNDER_REVIEW','2026-08-07 15:58:23'),(6,1,'UNDER_REVIEW','INFORMATION_REQUIRED',1,'Status changed to INFORMATION_REQUIRED','2026-08-07 15:58:31'),(7,1,'INFORMATION_REQUIRED','UNDER_REVIEW',1,'Status changed to UNDER_REVIEW','2026-08-07 15:58:36'),(8,1,'UNDER_REVIEW','UNDER_REVIEW',1,'Status changed to UNDER_REVIEW','2026-08-07 15:58:36'),(9,1,'UNDER_REVIEW','UNDER_REVIEW',1,'Status changed to UNDER_REVIEW','2026-08-07 15:58:36'),(10,1,'UNDER_REVIEW','INFORMATION_REQUIRED',1,'Status changed to INFORMATION_REQUIRED','2026-08-07 15:58:38'),(11,1,'INFORMATION_REQUIRED','APPROVED',1,'Status changed to APPROVED','2026-08-07 15:58:43'),(12,2,NULL,'SUBMITTED',NULL,'Application received','2026-08-07 16:01:42'),(13,2,'SUBMITTED','UNDER_REVIEW',1,'Status changed to UNDER_REVIEW','2026-08-07 16:04:21'),(14,2,'UNDER_REVIEW','INFORMATION_REQUIRED',1,'Status changed to INFORMATION_REQUIRED','2026-08-07 16:05:46'),(15,2,'INFORMATION_REQUIRED','APPROVED',1,'Status changed to APPROVED','2026-08-07 16:07:28'),(16,3,NULL,'SUBMITTED',NULL,'Application received','2026-08-07 16:58:53'),(17,4,NULL,'SUBMITTED',NULL,'Application received','2026-08-07 18:18:24'),(18,4,'SUBMITTED','CORRECTION_REQUIRED',1,'Status changed to CORRECTION_REQUIRED','2026-08-07 18:19:54'),(19,4,'CORRECTION_REQUIRED','APPROVED',1,'Status changed to APPROVED','2026-08-07 18:21:31'),(20,5,NULL,'SUBMITTED',NULL,'Application received','2026-08-07 18:25:45'),(21,5,'SUBMITTED','APPROVED',1,'Status changed to APPROVED','2026-08-07 18:26:31'),(22,3,'SUBMITTED','APPROVED',1,'Status changed to APPROVED','2026-08-07 18:26:43'),(23,5,'APPROVED','CORRECTION_REQUIRED',1,'Status changed to CORRECTION_REQUIRED','2026-08-07 19:47:58'),(24,5,'CORRECTION_REQUIRED','CORRECTION_REQUIRED',1,'Status changed to CORRECTION_REQUIRED','2026-08-07 20:21:18'),(25,2,'APPROVED','SUSPENDED',1,'Status changed to SUSPENDED','2026-08-11 14:22:24'),(26,31,NULL,'SUBMITTED',NULL,'Application received','2026-08-27 21:57:48'),(27,31,'SUBMITTED','RETRACTED',33,'Affiliateship retracted by partner.','2026-08-27 21:58:14'),(28,32,NULL,'SUBMITTED',NULL,'Application received','2026-08-30 08:47:49'),(29,32,'SUBMITTED','CORRECTION_REQUIRED',1,'Status changed to CORRECTION_REQUIRED','2026-08-30 08:51:00'),(30,32,'CORRECTION_REQUIRED','CORRECTION_REQUIRED',1,'Status changed to CORRECTION_REQUIRED','2026-08-30 09:23:39'),(31,32,'CORRECTION_REQUIRED','SUBMITTED',34,'Application improved and resubmitted by applicant for review.','2026-08-30 09:24:32'),(32,31,'RETRACTED','RETRACTION_ACKNOWLEDGED',1,'Status changed to RETRACTION_ACKNOWLEDGED','2026-08-30 09:25:12'),(33,32,'SUBMITTED','APPROVED',1,'Status changed to APPROVED','2026-08-30 09:25:39'),(34,33,NULL,'SUBMITTED',NULL,'Application received','2026-09-04 16:09:37'),(35,33,'SUBMITTED','APPROVED',1,'Status changed to APPROVED','2026-09-04 16:18:20');
/*!40000 ALTER TABLE `application_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_events`
--

DROP TABLE IF EXISTS `audit_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_actor` (`actor_user_id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_events`
--

LOCK TABLES `audit_events` WRITE;
/*!40000 ALTER TABLE `audit_events` DISABLE KEYS */;
INSERT INTO `audit_events` VALUES (1,2,'APPLICATION_SUBMITTED','affiliate_application','1',NULL,'2026-08-07 14:03:39'),(2,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"UNDER_REVIEW\", \"from\": \"SUBMITTED\"}','2026-08-07 15:58:11'),(3,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"UNDER_REVIEW\", \"from\": \"UNDER_REVIEW\"}','2026-08-07 15:58:15'),(4,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"INFORMATION_REQUIRED\", \"from\": \"UNDER_REVIEW\"}','2026-08-07 15:58:17'),(5,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"UNDER_REVIEW\", \"from\": \"INFORMATION_REQUIRED\"}','2026-08-07 15:58:23'),(6,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"INFORMATION_REQUIRED\", \"from\": \"UNDER_REVIEW\"}','2026-08-07 15:58:31'),(7,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"UNDER_REVIEW\", \"from\": \"INFORMATION_REQUIRED\"}','2026-08-07 15:58:36'),(8,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"UNDER_REVIEW\", \"from\": \"UNDER_REVIEW\"}','2026-08-07 15:58:36'),(9,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"UNDER_REVIEW\", \"from\": \"UNDER_REVIEW\"}','2026-08-07 15:58:36'),(10,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"INFORMATION_REQUIRED\", \"from\": \"UNDER_REVIEW\"}','2026-08-07 15:58:38'),(11,1,'APPLICATION_STATUS_CHANGED','affiliate_application','1','{\"to\": \"APPROVED\", \"from\": \"INFORMATION_REQUIRED\"}','2026-08-07 15:58:43'),(12,3,'APPLICATION_SUBMITTED','affiliate_application','2',NULL,'2026-08-07 16:01:42'),(13,1,'APPLICATION_STATUS_CHANGED','affiliate_application','2','{\"to\": \"UNDER_REVIEW\", \"from\": \"SUBMITTED\"}','2026-08-07 16:04:21'),(14,1,'APPLICATION_STATUS_CHANGED','affiliate_application','2','{\"to\": \"INFORMATION_REQUIRED\", \"from\": \"UNDER_REVIEW\"}','2026-08-07 16:05:46'),(15,1,'APPLICATION_STATUS_CHANGED','affiliate_application','2','{\"to\": \"APPROVED\", \"from\": \"INFORMATION_REQUIRED\"}','2026-08-07 16:07:28'),(16,4,'APPLICATION_SUBMITTED','affiliate_application','3',NULL,'2026-08-07 16:58:53'),(17,4,'PROFILE_UPDATED','user','4',NULL,'2026-08-07 17:15:57'),(18,5,'APPLICATION_SUBMITTED','affiliate_application','4',NULL,'2026-08-07 18:18:24'),(19,1,'APPLICATION_STATUS_CHANGED','affiliate_application','4','{\"to\": \"CORRECTION_REQUIRED\", \"from\": \"SUBMITTED\"}','2026-08-07 18:19:54'),(20,5,'PROFILE_UPDATED','user','5',NULL,'2026-08-07 18:20:57'),(21,1,'APPLICATION_STATUS_CHANGED','affiliate_application','4','{\"to\": \"APPROVED\", \"from\": \"CORRECTION_REQUIRED\"}','2026-08-07 18:21:31'),(22,6,'APPLICATION_SUBMITTED','affiliate_application','5',NULL,'2026-08-07 18:25:45'),(23,1,'APPLICATION_STATUS_CHANGED','affiliate_application','5','{\"to\": \"APPROVED\", \"from\": \"SUBMITTED\"}','2026-08-07 18:26:31'),(24,1,'APPLICATION_STATUS_CHANGED','affiliate_application','3','{\"to\": \"APPROVED\", \"from\": \"SUBMITTED\"}','2026-08-07 18:26:43'),(25,1,'APPLICATION_STATUS_CHANGED','affiliate_application','5','{\"to\": \"CORRECTION_REQUIRED\", \"from\": \"APPROVED\"}','2026-08-07 19:47:58'),(26,1,'APPLICATION_STATUS_CHANGED','affiliate_application','5','{\"to\": \"CORRECTION_REQUIRED\", \"from\": \"CORRECTION_REQUIRED\"}','2026-08-07 20:21:18'),(27,1,'APPLICATION_STATUS_CHANGED','affiliate_application','2','{\"to\": \"SUSPENDED\", \"from\": \"APPROVED\"}','2026-08-11 14:22:24'),(28,33,'APPLICATION_SUBMITTED','affiliate_application','31',NULL,'2026-08-27 21:57:48'),(29,33,'AFFILIATE_RETRACTED','affiliate_application','31','{\"to\": \"RETRACTED\", \"from\": \"SUBMITTED\"}','2026-08-27 21:58:14'),(30,34,'APPLICATION_SUBMITTED','affiliate_application','32',NULL,'2026-08-30 08:47:49'),(31,1,'APPLICATION_STATUS_CHANGED','affiliate_application','32','{\"to\": \"CORRECTION_REQUIRED\", \"from\": \"SUBMITTED\"}','2026-08-30 08:51:00'),(32,34,'PROFILE_UPDATED','user','34',NULL,'2026-08-30 08:52:09'),(33,1,'APPLICATION_STATUS_CHANGED','affiliate_application','32','{\"to\": \"CORRECTION_REQUIRED\", \"from\": \"CORRECTION_REQUIRED\"}','2026-08-30 09:23:39'),(34,34,'APPLICATION_RESUBMITTED','user','34',NULL,'2026-08-30 09:24:32'),(35,1,'APPLICATION_STATUS_CHANGED','affiliate_application','31','{\"to\": \"RETRACTION_ACKNOWLEDGED\", \"from\": \"RETRACTED\"}','2026-08-30 09:25:12'),(36,1,'APPLICATION_STATUS_CHANGED','affiliate_application','32','{\"to\": \"APPROVED\", \"from\": \"SUBMITTED\"}','2026-08-30 09:25:39'),(37,37,'APPLICATION_SUBMITTED','affiliate_application','33',NULL,'2026-09-04 16:09:37'),(38,1,'APPLICATION_STATUS_CHANGED','affiliate_application','33','{\"to\": \"APPROVED\", \"from\": \"SUBMITTED\"}','2026-09-04 16:18:20'),(39,34,'PROFILE_UPDATED','user','34',NULL,'2026-09-10 09:41:38'),(40,37,'PASSWORD_CHANGED','user','37',NULL,'2026-09-17 13:31:35'),(41,37,'PASSWORD_CHANGED','user','37',NULL,'2026-09-17 13:32:10'),(42,37,'PASSWORD_RESET_REQUESTED','user','37',NULL,'2026-09-17 13:34:11'),(43,37,'PASSWORD_RESET','user','37',NULL,'2026-09-17 13:48:27'),(44,37,'PASSWORD_CHANGED','user','37',NULL,'2026-09-17 13:49:05');
/*!40000 ALTER TABLE `audit_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries` (
  `code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries`
--

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` VALUES ('AU','Australia','AUD'),('GB','United Kingdom','GBP'),('ID','Indonesia','IDR'),('MY','Malaysia','MYR'),('PH','Philippines','PHP'),('SG','Singapore','SGD'),('TH','Thailand','THB'),('US','United States','USD'),('VN','Vietnam','VND');
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_closure_logs`
--

DROP TABLE IF EXISTS `deal_closure_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_closure_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `deal_id` bigint unsigned NOT NULL,
  `action_type` enum('FORCED_CLOSURE','APPEAL_SUBMITTED','EXTENSION_GRANTED','APPEAL_REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `days_extended` int NOT NULL DEFAULT '0',
  `action_notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_by_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_log_user` (`performed_by_user_id`),
  KEY `idx_closure_log_deal` (`deal_id`),
  CONSTRAINT `fk_log_deal` FOREIGN KEY (`deal_id`) REFERENCES `deal_pipeline` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_user` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_closure_logs`
--

LOCK TABLES `deal_closure_logs` WRITE;
/*!40000 ALTER TABLE `deal_closure_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `deal_closure_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_collections`
--

DROP TABLE IF EXISTS `deal_collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_collections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `deal_id` bigint unsigned NOT NULL,
  `invoice_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_total_myr` decimal(12,2) NOT NULL,
  `collected_amount_myr` decimal(12,2) NOT NULL,
  `bank_receipt_ref` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proof_media_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locked_direct_rate_pct` decimal(5,2) NOT NULL DEFAULT '10.00',
  `locked_upline_l1_rate_pct` decimal(5,2) NOT NULL DEFAULT '3.00',
  `locked_upline_l2_rate_pct` decimal(5,2) NOT NULL DEFAULT '1.50',
  `approval_status` enum('PENDING_APPROVAL','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'APPROVED',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approval_remarks` text COLLATE utf8mb4_unicode_ci,
  `is_immutable` tinyint(1) NOT NULL DEFAULT '1',
  `collection_date` date NOT NULL,
  `is_final_collection` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_test` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_coll_deal` (`deal_id`),
  CONSTRAINT `fk_coll_deal` FOREIGN KEY (`deal_id`) REFERENCES `deal_pipeline` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_collections`
--

LOCK TABLES `deal_collections` WRITE;
/*!40000 ALTER TABLE `deal_collections` DISABLE KEYS */;
INSERT INTO `deal_collections` VALUES (1,16,'INV-2026-0016',60000.00,60000.00,'MBB-12345678','/foliodesk/uploads/proofs/proof_1788538963173_9db2749c.jpg',12.50,7.50,0.00,'APPROVED',1,'2026-09-04 16:23:03','Approved and acknowledged by management. Bank receipt verified.',1,'2026-09-04',1,NULL,'2026-09-04 16:22:43',1),(4,8,'INV-2026-0008',120000.00,120000.00,'MBB-123458888','/foliodesk/uploads/proofs/proof_1789058328242_c5ac90ec.PNG',12.50,7.50,0.00,'APPROVED',1,'2026-09-10 16:39:10','Approved and acknowledged by management. Bank receipt verified.',1,'2026-09-10',1,NULL,'2026-09-10 16:38:48',1);
/*!40000 ALTER TABLE `deal_collections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_funnel_steps`
--

DROP TABLE IF EXISTS `deal_funnel_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_funnel_steps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `deal_id` bigint unsigned NOT NULL,
  `from_stage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_stage` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `step_title` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `affiliate_notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_by_user_id` bigint unsigned NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_review_status` enum('PENDING_REVIEW','ACKNOWLEDGED','RETURNED_FOR_REVIEW') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_REVIEW',
  `admin_remarks` text COLLATE utf8mb4_unicode_ci,
  `reviewed_by_user_id` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `is_immutable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_test` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_step_submitter` (`submitted_by_user_id`),
  KEY `fk_step_reviewer` (`reviewed_by_user_id`),
  KEY `idx_step_deal` (`deal_id`),
  KEY `idx_step_status` (`admin_review_status`),
  CONSTRAINT `fk_step_deal` FOREIGN KEY (`deal_id`) REFERENCES `deal_pipeline` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_step_reviewer` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_step_submitter` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_funnel_steps`
--

LOCK TABLES `deal_funnel_steps` WRITE;
/*!40000 ALTER TABLE `deal_funnel_steps` DISABLE KEYS */;
INSERT INTO `deal_funnel_steps` VALUES (1,15,'LEAD_SUBMITTED','LEAD_SUBMITTED','Discussions with Head of Projects','Wish to know more',37,'2026-09-04 16:12:45','ACKNOWLEDGED','Auto-acknowledged upon admin stage update',1,'2026-09-10 16:37:30',1,'2026-09-04 16:12:45','2026-09-10 16:37:30',1),(2,16,'LEAD_SUBMITTED','LEAD_SUBMITTED','Discussed with owner','Owner wants to know about project budgeting module',37,'2026-09-04 16:16:19','ACKNOWLEDGED','Auto-acknowledged upon management payment collection approval',NULL,NULL,1,'2026-09-04 16:16:19','2026-09-10 09:09:10',1),(3,15,'LEAD_SUBMITTED','QUALIFIED','Prospect has the budget for 5 user license','Prospect is okay with 1st year payment',37,'2026-09-09 16:39:08','RETURNED_FOR_REVIEW','How much did they budget?',1,'2026-09-10 14:48:24',1,'2026-09-09 16:39:08','2026-09-10 14:48:24',1),(4,15,'LEAD_SUBMITTED','PROPOSAL_SENT','Submitted proposal to prospect','Submitted Foliodesk proposal to prospect',37,'2026-09-10 09:00:52','ACKNOWLEDGED',NULL,1,'2026-09-10 14:47:44',1,'2026-09-10 09:00:52','2026-09-10 14:47:44',1),(5,16,'LEAD_SUBMITTED','FULLY_COLLECTED','6. Customer Payment Collection Fully Approved & Sealed','Full payment of RM 60,000.00 collected and verified via bank receipt.',1,'2026-09-10 09:09:10','ACKNOWLEDGED','Auto-generated upon collection management approval',NULL,'2026-09-10 09:09:10',1,'2026-09-10 09:09:10','2026-09-10 09:09:10',1),(6,1,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(7,1,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(8,1,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(9,1,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(10,2,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(11,2,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(12,2,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(13,2,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(14,3,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(15,3,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(16,3,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(17,3,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(18,4,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(19,4,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(20,4,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(21,4,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:04','2026-09-10 09:12:04',1),(22,5,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(23,5,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(24,5,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(25,5,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(26,6,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(27,6,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(28,6,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(29,6,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(30,7,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(31,7,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(32,7,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(33,7,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(34,8,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(35,8,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(36,8,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(37,8,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(38,9,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(39,9,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(40,9,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(41,9,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(42,10,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(43,10,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(44,10,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(45,10,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(46,11,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(47,11,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(48,11,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(49,11,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(50,12,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(51,12,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(52,12,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(53,12,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(54,13,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(55,13,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(56,13,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(57,13,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(58,14,NULL,'LEAD_SUBMITTED','1. Prospect Named & Registered','Initial commercial registration and account setup.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(59,14,NULL,'QUALIFIED','2. Technical & Budget Qualification','Completed initial qualification meeting with project procurement committee.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(60,14,NULL,'PROPOSAL_SENT','3. Commercial Proposal Delivered','Delivered formal software licensing proposal and project scope document.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(61,14,NULL,'CONTRACT_SIGNED','4. Official Contract Executed','Commercial agreement signed and order confirmed by customer.',1,'2026-08-11 19:53:20','ACKNOWLEDGED','Auto-generated initial baseline history',NULL,'2026-08-11 19:53:20',1,'2026-09-10 09:12:05','2026-09-10 09:12:05',1),(62,1,NULL,'INVOICED','Stage Advanced to INVOICED','Stage updated by administrator',1,'2026-09-10 12:29:19','ACKNOWLEDGED','Updated directly by administrator',1,'2026-09-10 12:29:19',1,'2026-09-10 12:29:19','2026-09-10 12:29:19',1),(63,1,NULL,'INVOICED','Stage Advanced to INVOICED','Stage updated by administrator',1,'2026-09-10 12:30:09','ACKNOWLEDGED','Updated directly by administrator',1,'2026-09-10 12:30:09',1,'2026-09-10 12:30:09','2026-09-10 12:30:09',1),(64,8,NULL,'INVOICED','Stage Advanced to INVOICED','Stage updated by administrator',1,'2026-09-10 15:21:23','ACKNOWLEDGED','Updated directly by administrator',1,'2026-09-10 15:21:23',1,'2026-09-10 15:21:23','2026-09-10 15:21:23',1),(65,9,NULL,'INVOICED','Stage Advanced to INVOICED','Stage updated by administrator',1,'2026-09-10 16:32:05','ACKNOWLEDGED','Updated directly by administrator',1,'2026-09-10 16:32:05',1,'2026-09-10 16:32:05','2026-09-10 16:32:05',1),(66,4,NULL,'INVOICED','Stage Advanced to INVOICED','Stage updated by administrator',1,'2026-09-10 16:34:50','ACKNOWLEDGED','Updated directly by administrator',1,'2026-09-10 16:34:50',1,'2026-09-10 16:34:50','2026-09-10 16:34:50',1),(67,15,NULL,'CONTRACT_SIGNED','Stage Advanced to CONTRACT SIGNED','Stage updated by administrator',1,'2026-09-10 16:37:30','ACKNOWLEDGED','Updated directly by administrator',1,'2026-09-10 16:37:30',1,'2026-09-10 16:37:30','2026-09-10 16:37:30',1);
/*!40000 ALTER TABLE `deal_funnel_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_pipeline`
--

DROP TABLE IF EXISTS `deal_pipeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_pipeline` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `affiliate_id` bigint unsigned NOT NULL,
  `deal_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `package_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package_count` int unsigned NOT NULL DEFAULT '1',
  `contract_value_myr` decimal(12,2) NOT NULL DEFAULT '60000.00',
  `extension_days_granted` int unsigned NOT NULL DEFAULT '0',
  `is_force_closed` tinyint(1) NOT NULL DEFAULT '0',
  `force_closed_at` timestamp NULL DEFAULT NULL,
  `force_closed_reason` text COLLATE utf8mb4_unicode_ci,
  `status_before_force_closure` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appeal_status` enum('NONE','APPEAL_SUBMITTED','APPEAL_APPROVED','APPEAL_REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `appeal_reason` text COLLATE utf8mb4_unicode_ci,
  `appeal_submitted_at` timestamp NULL DEFAULT NULL,
  `appeal_adjudicated_at` timestamp NULL DEFAULT NULL,
  `appeal_adjudication_notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('LEAD_SUBMITTED','QUALIFIED','PROPOSAL_SENT','SUSPENDED_EFFORT','ABORTED','CONTRACT_SIGNED','INVOICED','PARTIAL_COLLECTED','FULLY_COLLECTED','UNCOLLECTIBLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'LEAD_SUBMITTED',
  `status_note` text COLLATE utf8mb4_unicode_ci,
  `suspended_reason` text COLLATE utf8mb4_unicode_ci,
  `aborted_reason` text COLLATE utf8mb4_unicode_ci,
  `signed_date` date DEFAULT NULL,
  `invoice_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_target` enum('PROSPECT','AFFILIATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PROSPECT',
  `invoiced_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_test` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `deal_code` (`deal_code`),
  KEY `idx_deal_status` (`status`),
  KEY `idx_deal_affiliate` (`affiliate_id`),
  CONSTRAINT `fk_deal_affiliate` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliate_applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_pipeline`
--

LOCK TABLES `deal_pipeline` WRITE;
/*!40000 ALTER TABLE `deal_pipeline` DISABLE KEYS */;
INSERT INTO `deal_pipeline` VALUES (1,6,'DEAL-2026-0001','Genting Highlands Heavy Construction Sdn Bhd','contracts@gentingconst.my','+60128899001','Standard Tenant 5-User Operating Block',2,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'INVOICED',NULL,NULL,NULL,'2026-06-14','INV-2026-0001','PROSPECT','2026-09-10 12:30:09','2026-08-11 19:53:20','2026-09-10 12:30:09',1),(2,6,'DEAL-2026-0002','Sime Darby Industrial Partner','procurement@simedarbyind.my','+60127711223','Master Tenant License (Multi-Entity)',1,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-02',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(3,6,'DEAL-2026-0003','Gamuda Infra Subcontracting Division','infra@gamuda-sub.my','+60193344556','Standard Tenant 5-User Operating Block',3,180000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-28',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(4,12,'DEAL-2026-0004','Surbana Jurong Modular Infra Pte Ltd','modular@surbanajurong.sg','+6568910022','Master Tenant License (Multi-Entity)',1,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'INVOICED',NULL,NULL,NULL,'2026-06-20','INV-2026-0004','AFFILIATE','2026-09-10 16:34:50','2026-08-11 19:53:20','2026-09-10 16:34:50',1),(5,12,'DEAL-2026-0005','Keppel Offshore & Marine Engineering','marine@keppeloffshore.sg','+6567723344','Standard Tenant 5-User Operating Block',2,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-11',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(6,12,'DEAL-2026-0006','Sembcorp Specialised Piping Systems','piping@sembcorp.sg','+6565548899','Standard Tenant 5-User Operating Block',1,60000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-08-02',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(7,12,'DEAL-2026-0007','Woh Hup Heavy Contractors Pte Ltd','tenders@wohhup.sg','+6564412233','Standard Tenant 5-User Operating Block',4,240000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-08-05',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(8,24,'DEAL-2026-0008','Johor Port Logistics Hub Project','logistics@johorport.com.my','+60178822334','Standard Tenant 5-User Operating Block',2,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'FULLY_COLLECTED',NULL,NULL,NULL,'2026-05-18','INV-2026-0008','PROSPECT','2026-09-10 15:21:23','2026-08-11 19:53:20','2026-09-10 16:39:10',1),(9,24,'DEAL-2026-0009','MMC Corporation Sub-Vendor Network','vendor@mmccorp.my','+60134455667','Master Tenant License (Multi-Entity)',1,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'INVOICED',NULL,NULL,NULL,'2026-06-30','INV-2026-0009','PROSPECT','2026-09-10 16:32:05','2026-08-11 19:53:20','2026-09-10 16:32:05',1),(10,24,'DEAL-2026-0010','Pengerang Petroleum Engineering','eng@pengerangpetro.my','+60198877665','Standard Tenant 5-User Operating Block',3,180000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-19',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(11,7,'DEAL-2026-0011','Sunway MEP Subcontractor Services','mep@sunwayconst.my','+60129988776','Standard Tenant 5-User Operating Block',1,60000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-08',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(12,7,'DEAL-2026-0012','IJM Construction Partner Division','partner@ijm.my','+60136655443','Standard Tenant 5-User Operating Block',2,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-25',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(13,20,'DEAL-2026-0013','SP Group Substation Automation Partner','substation@spgroup.sg','+6563321144','Standard Tenant 5-User Operating Block',1,60000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-14',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(14,25,'DEAL-2026-0014','RTS Link Rail Contractors','rail@rtslink.my','+60172233445','Standard Tenant 5-User Operating Block',2,120000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED',NULL,NULL,NULL,'2026-07-22',NULL,'PROSPECT',NULL,'2026-08-11 19:53:20','2026-08-30 09:43:29',1),(15,33,'DEAL-2026-57ACCE','Mega Engineers PLC','contact@megaengineers.com.my','+60112342345','FolioDesk Cloud',1,60000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'CONTRACT_SIGNED','Submitted proposal to prospect: Submitted Foliodesk proposal to prospect',NULL,NULL,'2026-09-11',NULL,'PROSPECT',NULL,'2026-09-04 16:11:31','2026-09-10 16:37:30',1),(16,33,'DEAL-2026-8989E1','Kejuruteraan Cemerlang Sdn Bhd','contact@cemerlang.com.my','+60182998765','FolioDesk Cloud Enterprise',1,60000.00,0,0,NULL,NULL,NULL,'NONE',NULL,NULL,NULL,NULL,'FULLY_COLLECTED','Discussed with owner: Owner wants to know about project budgeting module',NULL,NULL,'2026-09-05','INV-2026-0016','PROSPECT','2026-09-04 16:21:45','2026-09-04 16:15:24','2026-09-04 16:23:04',1);
/*!40000 ALTER TABLE `deal_pipeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maker_checker_requests`
--

DROP TABLE IF EXISTS `maker_checker_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maker_checker_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `request_type` enum('COLLECTION_APPROVAL','PAYOUT_DISBURSEMENT','APPLICATION_APPROVAL','CLOSURE_APPEAL_ADJUDICATION') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `action_payload` json NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `submitted_by` bigint unsigned NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `decided_by` bigint unsigned DEFAULT NULL,
  `decided_at` timestamp NULL DEFAULT NULL,
  `decision_notes` text COLLATE utf8mb4_unicode_ci,
  `is_immutable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_mc_submitter` (`submitted_by`),
  KEY `fk_mc_decider` (`decided_by`),
  KEY `idx_mc_status` (`status`),
  KEY `idx_mc_type` (`request_type`),
  KEY `idx_mc_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_mc_decider` FOREIGN KEY (`decided_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_mc_submitter` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_mc_separation` CHECK (((`decided_by` is null) or (`decided_by` <> `submitted_by`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maker_checker_requests`
--

LOCK TABLES `maker_checker_requests` WRITE;
/*!40000 ALTER TABLE `maker_checker_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `maker_checker_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onboarded_customers`
--

DROP TABLE IF EXISTS `onboarded_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `onboarded_customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `affiliate_id` bigint unsigned NOT NULL,
  `customer_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `package_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package_count` int unsigned NOT NULL DEFAULT '1',
  `annual_value_myr` decimal(12,2) NOT NULL DEFAULT '60000.00',
  `signed_date` date NOT NULL,
  `status` enum('SIGNED','ACTIVE','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_test` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_customer_affiliate` (`affiliate_id`),
  CONSTRAINT `fk_customer_affiliate` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliate_applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onboarded_customers`
--

LOCK TABLES `onboarded_customers` WRITE;
/*!40000 ALTER TABLE `onboarded_customers` DISABLE KEYS */;
INSERT INTO `onboarded_customers` VALUES (15,33,'Kejuruteraan Cemerlang Sdn Bhd','contact@cemerlang.com.my','+60182998765','FolioDesk Cloud Enterprise',1,60000.00,'2026-09-05','ACTIVE','2026-09-10 10:47:17',1);
/*!40000 ALTER TABLE `onboarded_customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `packages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `package_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price_myr` decimal(12,2) NOT NULL,
  `billing_cycle` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'per annum',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `package_name` (`package_name`),
  UNIQUE KEY `package_code` (`package_code`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
INSERT INTO `packages` VALUES (16,'FolioDesk 5-User Annual License','FD-5USER-ANNUAL',60000.00,'per annum',1,'2026-09-10 22:29:11','2026-09-10 22:29:11'),(17,'FolioDesk 3-Year 5-User License','FD-3YR-5USER',158000.00,'3-year term',1,'2026-09-10 22:29:11','2026-09-10 22:29:11'),(18,'Unlimited Master Reseller License','FD-MASTER-RESELLER',1200000.00,'per annum',1,'2026-09-10 22:29:11','2026-09-10 22:29:11'),(19,'Design Partner Perpetual License','FD-DESIGN-PARTNER-LIFETIME',300000.00,'perpetual (max 10)',1,'2026-09-10 22:29:11','2026-09-10 22:29:11');
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `requested_ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_password_reset_user` (`user_id`),
  KEY `idx_password_reset_expiry` (`expires_at`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,37,'97dd2ad10080adc3b6059d537c67a5233179a62a1962d0ffa19d3118987877a2','2026-09-17 14:04:11','2026-09-17 13:48:27','2026-09-17 13:34:11','::1');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_advices`
--

DROP TABLE IF EXISTS `payment_advices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_advices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `advice_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `collection_id` bigint unsigned NOT NULL,
  `deal_id` bigint unsigned NOT NULL,
  `beneficiary_affiliate_id` bigint unsigned NOT NULL,
  `beneficiary_type` enum('DIRECT_AFFILIATE','UPLINE_L1','UPLINE_L2') COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate_percentage` decimal(5,2) NOT NULL,
  `collection_amount_base_myr` decimal(12,2) NOT NULL,
  `commission_amount_myr` decimal(12,2) NOT NULL,
  `payout_status` enum('PENDING_DISBURSEMENT','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_DISBURSEMENT',
  `paid_at` timestamp NULL DEFAULT NULL,
  `manual_bank_tx_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_notes` text COLLATE utf8mb4_unicode_ci,
  `payout_batch_id` bigint unsigned DEFAULT NULL,
  `is_immutable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_test` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `advice_number` (`advice_number`),
  KEY `fk_adv_collection` (`collection_id`),
  KEY `fk_adv_deal` (`deal_id`),
  KEY `idx_adv_beneficiary` (`beneficiary_affiliate_id`),
  KEY `idx_adv_status` (`payout_status`),
  KEY `fk_adv_batch` (`payout_batch_id`),
  CONSTRAINT `fk_adv_affiliate` FOREIGN KEY (`beneficiary_affiliate_id`) REFERENCES `affiliate_applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_adv_batch` FOREIGN KEY (`payout_batch_id`) REFERENCES `payout_batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_adv_collection` FOREIGN KEY (`collection_id`) REFERENCES `deal_collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_adv_deal` FOREIGN KEY (`deal_id`) REFERENCES `deal_pipeline` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_advices`
--

LOCK TABLES `payment_advices` WRITE;
/*!40000 ALTER TABLE `payment_advices` DISABLE KEYS */;
INSERT INTO `payment_advices` VALUES (1,'ADV-2026-8889AB',1,16,33,'DIRECT_AFFILIATE',12.50,60000.00,7500.00,'PAID','2026-09-04 16:24:00','DUITNOW 1234 2345',NULL,1,1,'2026-09-04 16:23:03','2026-09-04 16:24:00',1),(2,'ADV-2026-F35936',4,8,24,'DIRECT_AFFILIATE',12.50,120000.00,15000.00,'PENDING_DISBURSEMENT',NULL,NULL,NULL,NULL,1,'2026-09-10 16:39:10','2026-09-10 16:39:10',1);
/*!40000 ALTER TABLE `payment_advices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payout_batches`
--

DROP TABLE IF EXISTS `payout_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payout_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `batch_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `beneficiary_affiliate_id` bigint unsigned NOT NULL,
  `total_amount_myr` decimal(12,2) NOT NULL,
  `advice_count` int unsigned NOT NULL,
  `manual_bank_tx_ref` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_notes` text COLLATE utf8mb4_unicode_ci,
  `disbursed_by` bigint unsigned NOT NULL,
  `disbursed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_test` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch_code` (`batch_code`),
  KEY `fk_batch_affiliate` (`beneficiary_affiliate_id`),
  KEY `fk_batch_user` (`disbursed_by`),
  CONSTRAINT `fk_batch_affiliate` FOREIGN KEY (`beneficiary_affiliate_id`) REFERENCES `affiliate_applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_batch_user` FOREIGN KEY (`disbursed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payout_batches`
--

LOCK TABLES `payout_batches` WRITE;
/*!40000 ALTER TABLE `payout_batches` DISABLE KEYS */;
INSERT INTO `payout_batches` VALUES (1,'DISB-2026-235B5A',33,7500.00,1,'DUITNOW 1234 2345','Maybank','133425543',NULL,1,'2026-09-04 16:24:00','2026-09-04 16:24:00',1);
/*!40000 ALTER TABLE `payout_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rate_limit_attempts`
--

DROP TABLE IF EXISTS `rate_limit_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limit_attempts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `route` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `window_start` timestamp NOT NULL,
  `attempt_count` int unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rate_limit_window` (`identifier`,`route`,`window_start`),
  KEY `idx_rate_limit_window_start` (`window_start`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rate_limit_attempts`
--

LOCK TABLES `rate_limit_attempts` WRITE;
/*!40000 ALTER TABLE `rate_limit_attempts` DISABLE KEYS */;
INSERT INTO `rate_limit_attempts` VALUES (1,'::1','login','2026-09-17 13:25:00',1),(2,'::1:bashir@foliodesk.ai','login','2026-09-17 13:25:00',1),(3,'::1','login','2026-09-17 13:30:00',28),(4,'::1:bashir@foliodesk.ai','login','2026-09-17 13:30:00',28),(59,'::1','forgot-password','2026-09-17 13:30:00',1),(60,'::1:bashir@foliodesk.ai','forgot-password','2026-09-17 13:30:00',1),(61,'::1','login','2026-09-17 13:45:00',2),(62,'::1:bashir@foliodesk.ai','login','2026-09-17 13:45:00',2);
/*!40000 ALTER TABLE `rate_limit_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `csrf_token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_session_user` (`user_id`),
  KEY `idx_session_expiry` (`expires_at`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (1,1,'33107ba5d5582ca013eae107041ff6a7020eee3cdbd0a0690acd5c40549ed7e0','','2026-08-11 20:50:34','2026-08-04 20:50:34'),(2,1,'4c690bfabc5f6290c6515c9efd0521e3ee33d1c7a198be765fb88035541e8e1c','','2026-08-14 14:10:25','2026-08-07 14:10:25'),(3,1,'8b479aadc500989d4673a2650c81e91d563282c57ef08a724b5c5233eae11cb6','','2026-08-14 15:58:00','2026-08-07 15:58:00'),(4,3,'7157dc172345faa1a1e78dde0bc1d7ef4d9efc3ba5cf9aebada0f1177ef37fdc','','2026-08-14 16:02:23','2026-08-07 16:02:23'),(5,1,'2ddb56e305d9cfacb39e91b68d8f8adb722d585142355539713e5a31e9153ba7','','2026-08-14 16:04:05','2026-08-07 16:04:05'),(6,3,'1ce1e94b9a3d567204db2fc4c746f454639dd8e17daa9a72df99e4ac4208703b','','2026-08-14 16:05:08','2026-08-07 16:05:08'),(7,1,'a22e290a88e1dd7553eb44544cfad184a813a5eeab0cb75e8d525c5f35f11547','','2026-08-14 16:05:43','2026-08-07 16:05:43'),(8,3,'e4224bafa68771b7841ad4a0d52b87da14e18b8a3583728bb2b0d6000c63ffda','','2026-08-14 16:06:32','2026-08-07 16:06:32'),(9,1,'922d55bfc02991afaf7e7d6c4c2441c433bee74bd610c53da3928c34216909c5','','2026-08-14 16:07:24','2026-08-07 16:07:24'),(10,1,'e57ae71070ec6c7610b61f1181d0efb878fd06b1fa64fd33faf9924f322eecc1','','2026-08-14 16:08:12','2026-08-07 16:08:12'),(11,3,'e4e67260871a5adf78fdeea8e2c4fff65e0755c574772d948a1bbc70f5760710','','2026-08-14 16:08:22','2026-08-07 16:08:22'),(27,1,'bee263531688c5d5fb50bd07a779dfa82b35d03b158f36a2ad35968ad0f94a21','','2026-08-18 14:55:37','2026-08-11 14:55:37'),(29,1,'040fed22d7f5586c6d5e4df11a2d8ba7c4f7425e8f4e3102fd7b045a68927a46','','2026-08-25 16:08:58','2026-08-18 16:08:58'),(46,1,'4880cef19d4fd3509d7ff7b98e6c7a982d4b3a3a3173b94baa9276db741b85f9','','2026-09-11 09:53:23','2026-09-10 09:53:23'),(47,1,'7b2925a38e4ab92af23daf731a784660ae120ee2771edfa7b41f7adae8167b12','','2026-09-11 09:55:24','2026-09-10 09:55:24'),(48,1,'67265b3f3eb5b2d1aba8d9ec6edc66609620530741b867e4871480bbf3d9e022','','2026-09-11 10:00:03','2026-09-10 10:00:03'),(51,1,'8279ce3a1c6ab2888c2195266b35709adc24e487d5091836be7e8fd50dad82a0','','2026-09-11 10:14:18','2026-09-10 10:14:18'),(52,1,'479bce1b8c7b1d4a92ad721ee7ff4e7bd57a2bd9c359c39f24531a275541f2d8','','2026-09-11 10:16:24','2026-09-10 10:16:24'),(54,1,'c6b8fee12d7d62bcebaa853d724a98c8de024db35ebf594262d14cadc25e36f4','','2026-09-11 10:33:24','2026-09-10 10:33:24'),(56,1,'1ac227c1d9eb9dedda0e5f4fabf2036a1f909fc9d4b9dddba4f15b68b854cf04','','2026-09-17 11:20:45','2026-09-10 11:20:45'),(57,1,'94df5c14a6b9267dbcc991877537e2090270d3ba711cb2c3c0d3a7e801467a5e','','2026-09-17 11:41:17','2026-09-10 11:41:17'),(58,1,'af14880d8551970cf119b4a7cf04f30dccd1e04f070f6145e76e224a372780aa','','2026-09-17 11:49:46','2026-09-10 11:49:46'),(59,1,'e55818caefee64dc8eca3360ecce5e8ae41826877dea639d49191a89c8ab989c','','2026-09-17 12:16:51','2026-09-10 12:16:51'),(60,1,'718fac308d1d8edda319630f761684356fe43e73267468acb27a6b8b321caeff','','2026-09-17 12:45:28','2026-09-10 12:45:28'),(61,1,'9b303498a16379799f0f7511bfede3c6c1c50b71acf8e5849a567789a72e63d1','','2026-09-17 12:45:45','2026-09-10 12:45:45'),(62,1,'fd144601818cb6622d1f34e0a5c2d553020833248071403eb984c29514903b52','','2026-09-17 14:11:47','2026-09-10 14:11:47'),(63,1,'e5ae2200819712909c0f804e7b8e5157c819d09a3ff2427b8752d8f6365c785a','','2026-09-17 14:12:03','2026-09-10 14:12:03'),(65,1,'c651e67ef9e13003b369513f1354ceea83a4dfbe53964b921d07585296c04cc4','','2026-09-17 14:24:33','2026-09-10 14:24:33'),(66,1,'1c853cf3edf50c79a1ca9ce1c2b66f42ffe7754f094f9c7b74da9fa311bd58c6','','2026-09-17 14:26:13','2026-09-10 14:26:13'),(67,1,'5e5282b2b63cc21a6dc0cb95735cede5383a79d7414a63ed04f43b6657eb6b76','','2026-09-17 14:27:10','2026-09-10 14:27:10'),(68,1,'314b27e927367ada6c7e6f93bb0a490a08ac7925277f79e7605531a7af5a6ee5','','2026-09-17 14:27:33','2026-09-10 14:27:33'),(69,1,'41a46ff474eeb8da33cdcb5b2f80c2335e6c9bba96926189111d35377e87e712','','2026-09-17 14:29:12','2026-09-10 14:29:12'),(70,1,'e88198e0e22af9192acb39ec6b63e1850f33b216bcb0ef05c0c1e2c4bf2958cf','','2026-09-17 14:32:56','2026-09-10 14:32:56'),(71,1,'8781dd1c6be066a13d58f4ab052b45abc0ff52b13bb740aafa3e52fb7f56ed5c','','2026-09-17 14:35:07','2026-09-10 14:35:07'),(72,1,'5556d5aa4b6eaba858f9901370feaff49cf069d406531f517a8f0b752e8ba7f1','','2026-09-17 14:49:42','2026-09-10 14:49:42'),(74,1,'9f506b0008ed3c55e257cdd48051f2707bec3539d4a839da07bd3c6b7493a17f','','2026-09-17 14:51:25','2026-09-10 14:51:25'),(75,1,'a0741db4106735070a1c7677400bb403241981fa4572c91b310c410bbcaf44f4','','2026-09-17 14:54:51','2026-09-10 14:54:51'),(77,1,'4c1134b374ed1cc4e25f66ccade6457757c19f17215a5d25f32822d6a4c4febf','','2026-09-17 22:40:02','2026-09-10 22:40:02'),(80,1,'016e2757a34dd8fff48399799ed4e324b5cc2cc923447e492792972b0865d2df','','2026-09-17 22:47:07','2026-09-10 22:47:07'),(81,1,'1d3275431adbb8cbfca6803ab2e4c05a5937ee9002763c18e27040966e9c63d4','','2026-09-17 22:48:03','2026-09-10 22:48:03'),(82,1,'5d7752306c377539c6ce713f1d3cb2a074aeb260bd63c4413b1d2559cc3614f3','','2026-09-17 22:49:24','2026-09-10 22:49:24'),(83,7,'1b807e88aac1868ab385df2786a891889e06967b1389f627ea209c192bd02696','','2026-09-17 22:49:45','2026-09-10 22:49:45'),(84,1,'c605d57f0fdca14f140d0137fb8f27f7115a6c6c1b0aa35e66e8a6dc7bae0917','','2026-09-17 22:51:49','2026-09-10 22:51:49'),(85,7,'ae4d3fe3fe13bbdbadbd49fbbbf09e215e4ae3c62f57428825377a72651a7b9d','','2026-09-17 22:52:12','2026-09-10 22:52:12'),(86,1,'9fbadecd6149b7e9be017ef30bf50d13de537f47318bd6c7c96cc6bc1af62092','','2026-09-17 23:18:55','2026-09-10 23:18:55'),(87,1,'fa7fd73e21b766828b79adec847abea1a8c69a89a06ad15373a4627c19a3c352','','2026-09-17 23:19:23','2026-09-10 23:19:23'),(88,1,'c2ed548b7c2e045c466b63eddae797883459ce1c3a7c1c80aa9a25856e0b3a7a','','2026-09-17 23:19:57','2026-09-10 23:19:57'),(89,1,'a63e1c8820ad9e9eab2cd9e49b7f88a3efee0c8be3249ee70b9cd172dcefa0a1','','2026-09-17 23:28:23','2026-09-10 23:28:23'),(90,7,'7a4240f940692a340482717f5bb72531e87910dbe4c013a391dff6f27311ede7','','2026-09-17 23:30:05','2026-09-10 23:30:05'),(101,37,'9482d63b0a97f47950128effc578de049303da2ab10f7f454e030b2900b3aeab','4bc85fddf4647d31787280994df094c98b9142eca1edd34e534c2d17fca0b8b5','2026-09-24 13:49:15','2026-09-17 13:49:15');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `states`
--

DROP TABLE IF EXISTS `states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `states` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country_code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_state_country` (`country_code`),
  CONSTRAINT `fk_state_country` FOREIGN KEY (`country_code`) REFERENCES `countries` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `states`
--

LOCK TABLES `states` WRITE;
/*!40000 ALTER TABLE `states` DISABLE KEYS */;
INSERT INTO `states` VALUES (1,'MY','Johor'),(2,'MY','Kedah'),(3,'MY','Kelantan'),(4,'MY','Melaka'),(5,'MY','Negeri Sembilan'),(6,'MY','Pahang'),(7,'MY','Perak'),(8,'MY','Perlis'),(9,'MY','Pulau Pinang'),(10,'MY','Sabah'),(11,'MY','Sarawak'),(12,'MY','Selangor'),(13,'MY','Terengganu'),(14,'MY','W.P. Kuala Lumpur'),(15,'MY','W.P. Labuan'),(16,'MY','W.P. Putrajaya'),(17,'SG','Central Singapore'),(18,'SG','North East'),(19,'SG','North West'),(20,'SG','South East'),(21,'SG','South West'),(22,'ID','DKI Jakarta'),(23,'ID','West Java'),(24,'ID','Central Java'),(25,'ID','East Java'),(26,'ID','Bali'),(27,'TH','Bangkok'),(28,'TH','Chiang Mai'),(29,'TH','Phuket'),(30,'TH','Chonburi'),(31,'VN','Ho Chi Minh City'),(32,'VN','Hanoi'),(33,'VN','Da Nang'),(34,'PH','Metro Manila'),(35,'PH','Cebu'),(36,'PH','Davao'),(37,'AU','New South Wales'),(38,'AU','Victoria'),(39,'AU','Queensland'),(40,'AU','Western Australia'),(41,'GB','England'),(42,'GB','Scotland'),(43,'GB','Wales'),(44,'GB','Northern Ireland'),(45,'US','California'),(46,'US','New York'),(47,'US','Texas'),(48,'US','Florida');
/*!40000 ALTER TABLE `states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('admin_data_mode','ALL','Active data mode filter for admin portal: TEST, ACTUAL, or ALL','2026-09-14 17:03:16'),('default_closure_period_days','90','Default closure period in days from initial prospect log','2026-08-30 12:03:22'),('direct_commission_rate_pct','12.50','Direct selling affiliate commission percentage','2026-09-04 16:20:46'),('upline_l1_commission_rate_pct','7.50','Upline Level 1 override commission percentage','2026-09-04 16:20:46'),('upline_l2_commission_rate_pct','0.00','Upline Level 2 override commission percentage','2026-09-04 16:20:46');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('APPLICANT','AFFILIATE','ADMIN','MANAGEMENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'APPLICANT',
  `status` enum('ACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@foliodesk.local','pbkdf2$210000$8c2aa6ce14fd1fac55743343fbf2e46f$c68d5bd48bb10b8af8fd578f6e3f4c7d6ff82d460b40b7b1d1b4cb5786325dc2','FolioDesk Administrator','ADMIN','ACTIVE','2026-08-04 20:49:15','2026-08-30 09:29:20'),(2,'superadmin@kojid.com.my','pbkdf2$210000$dc73e1c6de04fddc1a336ab4699f35ba$f0ad7891cdec799cf24ae11cda6eaf7b6dea067cce6c605af270a01b70b97924','Test Affiliate 1','AFFILIATE','ACTIVE','2026-08-07 14:03:38','2026-09-10 10:12:54'),(3,'testaffiliate2@foliodesk.ai','pbkdf2$210000$8ea43cda1faff8d3a459d5d62e432a2b$b8eb3aba13fdcf4834676ea516310aa17ecfe363cbd8a73be4c617749c996db6','Test Affiliate 2','APPLICANT','ACTIVE','2026-08-07 16:01:42','2026-08-07 16:01:42'),(4,'testaffiliate3@foliodesk.ai','pbkdf2$210000$9dc21f494ef1e93e6e4619c894f01bb4$da6a45226c40fa184ce333711a001df55701c14370b50fd330344266ddfb90e5','Test Affiliate 3','AFFILIATE','ACTIVE','2026-08-07 16:58:53','2026-09-10 10:12:54'),(5,'affiliate5@foliodesk.ai','pbkdf2$210000$7db930efc91dc25d205be50cd05af368$8b59a912bf20476d20bdf31a69e4c318fb91962311d60a8d91e0dbfe275da5ac','Affiliate 5','AFFILIATE','ACTIVE','2026-08-07 18:18:24','2026-09-10 10:12:54'),(6,'affiliate6@foliodesk.ai','pbkdf2$210000$b648a24228ff5e8e1146c4faa62efd89$e5c75d2fc289544d34717b63eb559c7d62f8356e84449fdbb4e64d3f6ea4e733','Affiliate 6','APPLICANT','ACTIVE','2026-08-07 18:25:45','2026-08-07 18:25:45'),(7,'apex.holdings@apexeng.my','pbkdf2$210000$8c2aa6ce14fd1fac55743343fbf2e46f$c68d5bd48bb10b8af8fd578f6e3f4c7d6ff82d460b40b7b1d1b4cb5786325dc2','Apex Engineering Holdings Sdn Bhd','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-09-10 23:30:10'),(8,'projects@synergyme.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Synergy M&E Solutions Sdn Bhd','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-08-11 18:54:30'),(9,'info@kvpiping.com.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Klang Valley Piping & Fittings Sdn Bhd','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-08-11 18:54:30'),(10,'contracts@selangorcivil.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Selangor Civil Works Services','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-08-11 18:54:30'),(11,'sales@pinnaclesteel.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Pinnacle Structural Steel Fab','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-08-11 18:54:30'),(12,'admin@borneogeo.com.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Borneo Geotechnical Services','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-08-11 18:54:30'),(13,'contact@binatech.sg','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Bina Tech Infra Pte Ltd','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-08-11 18:54:30'),(14,'tender@liongrid.sg','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Lion City Power & Grid Pte Ltd','AFFILIATE','ACTIVE','2026-08-11 18:50:04','2026-08-11 18:54:30'),(23,'eng@jurongauto.sg','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Jurong Industrial Automation','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(24,'projects@tuashv.sg','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Tuas High-Voltage Subcontractors','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(25,'mep@changiconsult.sg','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Changi MEP Consultants Pte Ltd','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(26,'corp@nanyangheavy.com.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Nanyang Heavy Industries Corp','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(27,'projects@southrail.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Southern Railway Systems Sdn Bhd','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(28,'ops@johorcrane.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Johor Crane & Heavy Lift Operations','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(29,'contact@melakamarine.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Melaka Marine Fabrication Ltd','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(30,'service@straitsoffshore.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Straits Offshore Maintenance','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(31,'batu@dockyard.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Batu Pahat Dockyard Support','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(32,'logistics@kuantanport.my','pbkdf2$210000$cb16071e3854de25dbe06d989a4940a7$0e0b6f0fb5e0d58343eb47276c33905e0ce4c1e20f04fa0bc2600c4602850dca','Kuantan Port Logistics Engineering','AFFILIATE','ACTIVE','2026-08-11 18:54:30','2026-08-11 18:54:30'),(33,'usahamaju@foliodesk.com','pbkdf2$210000$6b7247317102980e6a6cf56eb06c29aa$4984019ae839975a125573d97e9c136258c1eb34be48b27628a5a79f1b7670c4','Syarikat Usaha Maju','APPLICANT','ACTIVE','2026-08-27 21:57:48','2026-08-27 21:57:48'),(34,'hupseng@foliodesk.com','pbkdf2$210000$069c89b777618375e52623456d0dfed1$e55d9904cfb716a96bdfc7f6358e099f8d6f0c66d9e14eb6ca523bdac2ba408d','Syarikat Kejuruteraan Hup Seng','AFFILIATE','ACTIVE','2026-08-30 08:47:49','2026-09-10 10:12:54'),(37,'bashir@foliodesk.ai','pbkdf2$210000$5f2ff07e85714a6c7a346d99e0db7a51$9e258df707e6a22e36f0777e9b814bef307871d25d259969db20757433454368','Bashir Bin Harun','AFFILIATE','ACTIVE','2026-09-04 16:09:37','2026-09-17 13:49:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-18  1:25:36
