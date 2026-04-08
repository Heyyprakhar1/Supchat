-- Analytics schema for blog data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    topic VARCHAR(100) NOT NULL,
    author VARCHAR(100),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    read_time_minutes INTEGER,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
INSERT INTO articles (title, slug, topic, author, views, likes, shares, comments, read_time_minutes, published_at) VALUES
('The Future of AI in 2024', 'future-ai-2024', 'AI', 'Jane Smith', 15420, 423, 120, 45, 8, NOW() - INTERVAL '2 days'),
('DevOps Best Practices Guide', 'devops-best-practices', 'DevOps', 'John Doe', 8930, 234, 89, 23, 12, NOW() - INTERVAL '5 days'),
('Understanding Vector Databases', 'vector-databases', 'AI', 'Alice Chen', 12300, 567, 230, 89, 10, NOW() - INTERVAL '7 days'),
('Kubernetes vs Docker Swarm', 'k8s-vs-swarm', 'DevOps', 'Bob Wilson', 6700, 189, 56, 34, 15, NOW() - INTERVAL '10 days'),
('Python Asyncio Deep Dive', 'python-asyncio', 'Programming', 'Carol Lee', 11200, 445, 178, 67, 20, NOW() - INTERVAL '14 days'),
('React Server Components', 'react-server-components', 'Programming', 'David Kim', 9800, 334, 145, 52, 12, NOW() - INTERVAL '20 days'),
('Machine Learning Pipeline', 'ml-pipeline', 'AI', 'Emma Davis', 13400, 678, 289, 78, 18, NOW() - INTERVAL '25 days'),
('Infrastructure as Code', 'iac-terraform', 'DevOps', 'Frank Miller', 7500, 223, 78, 29, 14, NOW() - INTERVAL '28 days');

-- Indexes for performance
CREATE INDEX idx_articles_topic ON articles(topic);
CREATE INDEX idx_articles_created_at ON articles(created_at);
CREATE INDEX idx_articles_published_at ON articles(published_at);

-- Analytics view
CREATE VIEW article_analytics AS
SELECT 
    topic,
    COUNT(*) as article_count,
    AVG(views) as avg_views,
    SUM(views) as total_views,
    AVG(likes) as avg_likes,
    AVG(shares) as avg_shares
FROM articles
GROUP BY topic;

