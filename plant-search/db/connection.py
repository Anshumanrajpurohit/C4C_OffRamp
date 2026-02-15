"""Database connection management using psycopg2."""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Any, Dict, Generator, Optional

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

# Global connection pool
_connection_pool: Optional[psycopg2.pool.SimpleConnectionPool] = None


def get_db_config() -> Dict[str, Any]:
    """Get database configuration from environment variables."""
    return {
        "host": os.getenv("DB_HOST", "project-db.cluster-clga8ke4eiex.ap-southeast-2.rds.amazonaws.com"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "database": os.getenv("DB_NAME", "OffRamp"),
        "user": os.getenv("DB_USER", "dbadmin"),
        "password": os.getenv("DB_PASSWORD", "sz6pa2ST0BqNS*yT2Y$g"),
    }


def init_db_pool(min_conn: int = 1, max_conn: int = 20) -> None:
    """Initialize the database connection pool."""
    global _connection_pool
    
    if _connection_pool is not None:
        return
    
    config = get_db_config()
    print(f"[DB] Initializing connection pool to {config['host']}:{config['port']}/{config['database']}")
    
    try:
        _connection_pool = psycopg2.pool.SimpleConnectionPool(
            min_conn,
            max_conn,
            **config
        )
        print(f"[DB] Connection pool initialized successfully ({min_conn}-{max_conn} connections)")
    except Exception as e:
        print(f"[DB ERROR] Failed to initialize connection pool: {e}")
        raise


def close_db_pool() -> None:
    """Close all connections in the pool."""
    global _connection_pool
    
    if _connection_pool is not None:
        _connection_pool.closeall()
        _connection_pool = None
        print("[DB] Connection pool closed")


@contextmanager
def get_db_connection() -> Generator[psycopg2.extensions.connection, None, None]:
    """
    Context manager for database connections.
    
    Usage:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM dishes")
    """
    if _connection_pool is None:
        init_db_pool()
    
    conn = _connection_pool.getconn()
    
    try:
        yield conn
    except Exception as e:
        conn.rollback()
        print(f"[DB ERROR] Transaction rolled back: {e}")
        raise
    finally:
        _connection_pool.putconn(conn)


def close_db_connection(conn: psycopg2.extensions.connection) -> None:
    """Return a connection to the pool."""
    if _connection_pool is not None:
        _connection_pool.putconn(conn)


def execute_query(query: str, params: tuple = None, fetch: bool = True) -> Any:
    """
    Execute a query and return results.
    
    Args:
        query: SQL query string
        params: Query parameters
        fetch: Whether to fetch results (SELECT) or just execute (INSERT/UPDATE)
    
    Returns:
        Query results as list of dicts if fetch=True, otherwise None
    """
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            
            if fetch:
                return cursor.fetchall()
            else:
                conn.commit()
                return None


def execute_many(query: str, params_list: list) -> None:
    """Execute a query multiple times with different parameters."""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.executemany(query, params_list)
            conn.commit()
