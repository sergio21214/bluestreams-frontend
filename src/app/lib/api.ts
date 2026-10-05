export function authHeaders() {

  const token =
    localStorage.getItem('token');

  return {
    Authorization:
      `Bearer ${token}`
  };
}