import {useEffect, useState} from 'react';
import useLocalStorage from '../hooks/use-local-storage';
import jwt from 'jsonwebtoken';
import uniqid from 'uniqid';
// import Layout from './app';
import styles from './login.module.css';
import {createSpotifyLoginUrl} from '../auth/spotify';

export default function Login({
  redirectTo,
  warningMessage,
}: {
  redirectTo: string;
  warningMessage?: string;
}) {
  const [secret, setSecret, isSecretInitialized] = useLocalStorage(
    'spotify_token_state_secret',
    '',
  );
  const [tokenState, setTokenState] = useState('');

  useEffect(() => {
    if (isSecretInitialized && !secret) {
      setSecret(uniqid());
    }
  }, [secret, setSecret, isSecretInitialized]);

  useEffect(() => {
    if (secret && !tokenState) {
      setTokenState(jwt.sign({redirectTo}, secret));
    }
  }, [secret, redirectTo, tokenState]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {tokenState ? (
          <>
            {warningMessage && (
              <p className={styles.warning_message}>{warningMessage}</p>
            )}
            <a
              className={styles.SignIn}
              href={createSpotifyLoginUrl(tokenState)}
            >
              Login to Spotify
            </a>
          </>
        ) : (
          <p>Please wait...</p>
        )}
      </main>
    </div>
  );
}
