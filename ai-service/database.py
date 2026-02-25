import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

# We use the asyncpg driver
DATABASE_URL = os.getenv("SUPABASE_DB_URL", "postgresql+asyncpg://postgres.mztbiewiqjnairxnurfk:XOT0B9LkUQ9CrZcC@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres")

# Transform standard postgresql:// to postgresql+asyncpg:// if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
# Supabase pooler requires ssl for production but local may not
# However for this connection string, Supabase requires parameters or just standard connect.

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
