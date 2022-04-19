import {rest} from 'msw';

export const handlers = [
  rest.get(
    'https://www.example.com/__test_domain__/oauth2/user_profile',
    (req, res, ctx) => {
      return res(
        ctx.json({
          id: 'kp:af23c91f1ab9441b96f7d358580a366c',
          last_name: null,
          first_name: 'EssDee Kay',
          preferred_email: 'peterphanouvong0+sdk@gmail.com'
        })
      );
    }
  ),

  rest.post(
    'https://www.example.com/__test_domain__/oauth2/token',
    (req, res, ctx) => {
      return res(
        ctx.json({
          access_token:
            'eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ1OjllOmQwOjljOjE5OjA0OjRiOjRmOjI0OjE4OmZkOmI2OjE4OjQyOjA2OjMzIiwidHlwIjoiSldUIn0.eyJhdWQiOltdLCJleHAiOjE2NDc4NDM4MTUsImlhdCI6MTY0Nzg0MDIxNSwiaXNzIjoiaHR0cHM6Ly9zZGsua2luZGUubG9jYWx0ZXN0Lm1lIiwianRpIjoiOTUwNzYzM2UtYjgxNy00MGJlLWI1OTktMTI0MGQ2NWEzOWFkIiwibmJmIjoxNjQ3ODQwMjE1LCJzY3AiOlsib3BlbmlkIiwib2ZmbGluZSJdLCJzdWIiOiJrcDphZjIzYzkxZjFhYjk0NDFiOTZmN2QzNTg1ODBhMzY2YyJ9.OlD35Js81j6-J6xyusnKSPWR0U72Qh3g9bP1PBm7MPstFdmN755Z2a-9cP-Ve__tdxrf6_K6SbjvsTj4_Mhp6s34uHj2qagI6YJ_wmhH8Vvw5hRqQAKiXjcjPLKeDwjKtX9MhLN6e_XYSL_8OZK_uRs8v3K9J1RcMxK-6O5DiZd4lgdExO-vz90YK9p9ZrW1Sv30DmDGHX6Ylof1sDb_4HI44hkou17asfJ-wGMPihyelC9QRdRT_hhfN43DH4tiBpux2h--rHSeji_MphNAhJJutu4hs_PfABHjE-7BNcpPaO6KcmtT3vy38_Ls_MiWe62w5TZKhY0O0w1XrCLT9Q'
        })
      );
    }
  ),

  rest.get(
    'https://www.example.com/__test_error__/oauth2/user_profile',
    (req, res, ctx) => {
      throw Error('peni');
    }
  ),

  rest.post(
    'https://www.example.com/__test_error__/oauth2/token',
    (req, res, ctx) => {
      return res(
        // Send a valid HTTP status code
        ctx.status(403),
        // And a response body, if necessary
        ctx.json({
          errorMessage: `error`
        })
      );
    }
  )
];
