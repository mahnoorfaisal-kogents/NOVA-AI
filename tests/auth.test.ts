import test from "node:test";
import assert from "node:assert/strict";

// Test Auth State Machine representation
type AuthState =
  | "INITIALIZING"
  | "UNAUTHENTICATED"
  | "SIGNING_UP"
  | "AWAITING_EMAIL_CONFIRMATION"
  | "AUTHENTICATED"
  | "SIGNING_IN"
  | "SIGNING_OUT"
  | "ERROR";

test("Auth State Machine: initial state is INITIALIZING", () => {
  const state: AuthState = "INITIALIZING";
  assert.equal(state, "INITIALIZING");
});

test("Auth State Machine: transition to AUTHENTICATED when session exists", () => {
  let state: AuthState = "INITIALIZING";
  const session = { user: { id: "u-123", email: "test@nova.ai" } };

  if (session?.user) {
    state = "AUTHENTICATED";
  } else {
    state = "UNAUTHENTICATED";
  }

  assert.equal(state, "AUTHENTICATED");
});

test("Auth State Machine: transition to UNAUTHENTICATED when no session", () => {
  let state: AuthState = "INITIALIZING";
  const session = null;

  if (session) {
    state = "AUTHENTICATED";
  } else {
    state = "UNAUTHENTICATED";
  }

  assert.equal(state, "UNAUTHENTICATED");
});

test("Auth State Machine: Sign Up handles email confirmation required (no session)", () => {
  let state: AuthState = "SIGNING_UP";

  // Supabase returns user but null session when email confirmation is enabled
  const signUpResponse = {
    data: { user: { id: "u-new", email: "verify@nova.ai" }, session: null },
    error: null,
  };

  let needsConfirmation = false;
  if (!signUpResponse.error && signUpResponse.data?.user && !signUpResponse.data?.session) {
    state = "AWAITING_EMAIL_CONFIRMATION";
    needsConfirmation = true;
  }

  assert.equal(state, "AWAITING_EMAIL_CONFIRMATION");
  assert.equal(needsConfirmation, true);
});

test("Auth State Machine: Sign Up handles immediate session", () => {
  let state: AuthState = "SIGNING_UP";

  const signUpResponse = {
    data: {
      user: { id: "u-new", email: "direct@nova.ai" },
      session: { access_token: "token-abc" },
    },
    error: null,
  };

  if (!signUpResponse.error && signUpResponse.data?.session) {
    state = "AUTHENTICATED";
  }

  assert.equal(state, "AUTHENTICATED");
});

test("Auth State Machine: Sign In error transitions to ERROR", () => {
  let state: AuthState = "SIGNING_IN";
  const signInResponse = {
    data: { user: null, session: null },
    error: { message: "Invalid login credentials" },
  };

  let errorMessage: string | null = null;
  if (signInResponse.error) {
    state = "ERROR";
    errorMessage = signInResponse.error.message;
  }

  assert.equal(state, "ERROR");
  assert.equal(errorMessage, "Invalid login credentials");
});

test("Auth State Machine: Sign Out clears state to UNAUTHENTICATED", () => {
  let state: AuthState = "AUTHENTICATED";
  let user: any = { id: "u-123" };
  let session: any = { token: "xyz" };

  // Trigger Sign Out
  state = "SIGNING_OUT";
  user = null;
  session = null;
  state = "UNAUTHENTICATED";

  assert.equal(state, "UNAUTHENTICATED");
  assert.equal(user, null);
  assert.equal(session, null);
});
