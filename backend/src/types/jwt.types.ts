// JWT payload shape — attached to req.user after token verification
export interface JwtPayload {
  id: number
  role: string
}