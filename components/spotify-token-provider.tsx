import {ReactNode, createContext, useEffect, useState} from 'react';
import useLocalStorage from '../hooks/use-local-storage';
import {useRouter} from 'next/router';
import {parse} from 'query-string';
import jwt from 'jsonwebtoken';
import Login from './login';

type Props = {
  children?: ReactNode;
};

type TokenData = {
  token: string;
  expiry: number;
};

export const SpotifyTokenContext = createContext<TokenData>({
  token: '',
  expiry: 0,
});

export default function SpotifyTokenProvider({children}: Props) {
  const [token, setToken] = useLocalStorage('spotify_token', '');
  const [expiry, setExpiry] = useLocalStorage('spotify_token_expiry', 0);
  const [secret] = useLocalStorage('spotify_token_state_secret', '');
  const [isTokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (router.asPath.includes('access_token') && secret) {
      const {access_token, expires_in, state} = parse(
        router.asPath.replace(/\//g, ''),
      );
      try {
        const payload = jwt.verify(String(state), secret) as {
          redirectTo: string;
        };
        setToken(access_token as string);
        setExpiry(Number(expires_in) * 1000 + Date.now());
        router.replace(payload.redirectTo);
      } catch (error) {
        console.error(error);
        setErrorMessage('Failed to get a Spotify access token.');
      }
    }
  }, [router, secret, setToken, setExpiry]);

  useEffect(() => {
    const timeLeft = expiry - Date.now();
    if (token && timeLeft > 0) {
      setTokenValid(true);
      const timeout = setTimeout(() => {
        setTokenValid(false);
        setErrorMessage('The Spotify access token has expired.');
      }, timeLeft);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [expiry, token]);

  if (isTokenValid)
    return (
      <SpotifyTokenContext.Provider value={{token, expiry}}>
        {children}
      </SpotifyTokenContext.Provider>
    );
  else
    return (
      <>
        <Login redirectTo={router.asPath} warningMessage={errorMessage} />
      </>
    );
}
