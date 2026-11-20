CREATE DATABASE IF NOT EXISTS event_ticketing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_ticketing;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('attendee', 'organizer', 'staff') NOT NULL DEFAULT 'attendee',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  organizer_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  starts_at DATETIME NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket_tiers (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_cents BIGINT NOT NULL,
  capacity INT NOT NULL,
  sold INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_tiers_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT chk_tier_capacity CHECK (capacity >= 1),
  CONSTRAINT chk_tier_sold CHECK (sold >= 0 AND sold <= capacity)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  reference_code VARCHAR(32) NOT NULL UNIQUE,
  user_id VARCHAR(64) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  tier_id VARCHAR(64) NOT NULL,
  quantity INT NOT NULL,
  total_cents BIGINT NOT NULL,
  refunded_cents BIGINT NOT NULL DEFAULT 0,
  status ENUM('pending', 'paid', 'cancelled', 'refunded', 'checked_in') NOT NULL DEFAULT 'pending',
  expires_at BIGINT NOT NULL,
  qr_token TEXT NULL,
  checked_in_at VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT fk_bookings_tier FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id),
  CONSTRAINT chk_booking_qty CHECK (quantity >= 1 AND quantity <= 10)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  tier_id VARCHAR(64) NOT NULL,
  status ENUM('waiting', 'offered', 'accepted', 'expired') NOT NULL DEFAULT 'waiting',
  offer_expires_at BIGINT NULL,
  created_at BIGINT NOT NULL,
  CONSTRAINT fk_waitlist_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_waitlist_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT fk_waitlist_tier FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id)
) ENGINE=InnoDB;