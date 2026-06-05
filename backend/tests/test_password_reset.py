from app.core.security import hash_password, verify_password
from app.services.password_reset import request_password_reset, reset_password


def test_forgot_password_unknown_email(client):
    res = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert res.status_code == 200
    body = res.json()
    assert body["debug_reset_url"] is None


def test_password_reset_flow(client, db_session):
    from app.models.user import User

    user = User(email="reset@example.com", password_hash=hash_password("oldpassword1"))
    db_session.add(user)
    db_session.commit()

    res = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert res.status_code == 200
    debug_url = res.json().get("debug_reset_url")
    assert debug_url
    token = debug_url.split("token=")[1]

    ok = client.post(
        "/api/auth/reset-password",
        json={"token": token, "password": "newpassword1"},
    )
    assert ok.status_code == 200

    db_session.refresh(user)
    assert verify_password("newpassword1", user.password_hash)
    assert not verify_password("oldpassword1", user.password_hash)

    login_new = client.post(
        "/api/auth/login",
        data={"username": "reset@example.com", "password": "newpassword1"},
    )
    assert login_new.status_code == 200

    reuse = client.post(
        "/api/auth/reset-password",
        json={"token": token, "password": "anotherpass1"},
    )
    assert reuse.status_code == 400
