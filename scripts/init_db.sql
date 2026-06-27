-- Create synapse database
CREATE DATABASE synapse
    ENCODING 'UTF8'
    LC_COLLATE 'C'
    LC_CTYPE 'C'
    TEMPLATE template0;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE synapse TO ${POSTGRES_USER};
