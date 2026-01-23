export const config = () => ({
  port: Number(process.env.PORT),
  AUTHENTICATION_URL: process.env.AUTHENTICATION_URL,
  NDI_CLIENT_ID: process.env.NDI_CLIENT_ID,
  NDI_CLIENT_SECRET: process.env.NDI_CLIENT_SECRET,
  NDI_AUTH_GRANT_TYPE: process.env.NDI_AUTH_GRANT_TYPE,
  ENABLE_CORS_IP_LIST: process.env.ENABLE_CORS_IP_LIST,
});
