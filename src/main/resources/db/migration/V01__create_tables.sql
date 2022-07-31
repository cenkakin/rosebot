CREATE TABLE tweets
(
    id                          UUID               DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP
);
