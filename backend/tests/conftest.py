import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.session import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import TicketCategory

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed basic categories and admin
    admin = User(
        email="admin@test.com",
        full_name="Admin Test",
        hashed_password=get_password_hash("password123"),
        role="admin",
        is_active=True
    )
    agent = User(
        email="agent@test.com",
        full_name="Agent Test",
        hashed_password=get_password_hash("password123"),
        role="agent",
        is_active=True
    )
    customer = User(
        email="customer@test.com",
        full_name="Customer Test",
        hashed_password=get_password_hash("password123"),
        role="customer",
        is_active=True
    )
    tech_cat = TicketCategory(name="Technical Issue", description="Bugs and errors")
    bill_cat = TicketCategory(name="Billing & Payments", description="Invoices and charges")
    session.add_all([admin, agent, customer, tech_cat, bill_cat])
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
