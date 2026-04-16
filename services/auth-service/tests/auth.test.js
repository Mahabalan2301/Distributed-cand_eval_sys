const request = require("supertest");
const app = require("../index");

describe("Auth Service Endpoints", () => {
  let token;
  const testEmail = `test_${Date.now()}@example.com`;

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        email: testEmail,
        password: "password123"
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "User registered successfully");
  });

  it("should login the user and return a token", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        email: testEmail,
        password: "password123"
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should fail to login with wrong password", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        email: testEmail,
        password: "wrongpassword"
      });
    expect(res.statusCode).toEqual(401);
  });

  it("should fetch user profile", async () => {
    const res = await request(app)
      .get("/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("email", testEmail);
  });
});
