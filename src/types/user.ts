// types/userTypes.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: "player" | "admin";
}
