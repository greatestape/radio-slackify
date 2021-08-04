import Head from 'next/head';
import useSpotifyToken from '../../hooks/use-spotify-token';
import {gql} from '@apollo/client';
import client from '../../graphql/apollo-client';
import {NexusGenFieldTypes} from '../../graphql/nexus';
import {GetStaticProps} from 'next';
import {ParsedUrlQuery} from 'querystring';
import {Station as StationType} from '@prisma/client';
import SearchBox from '../../components/search-box';
import PlayList from '../../components/play-list';
import Player from '../../components/player';

type Query = NexusGenFieldTypes['Query'];

const GET_STATION_LIST = gql`
  query Query {
    stations {
      id
      name
      meta {
        name
      }
    }
  }
`;

export default function Station({station}: {station: StationType}) {
  const {spotifyToken} = useSpotifyToken();

  return (
    <div>
      <Head>
        <title>Station - {station.name}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Station - {station.name}</h1>
      <Player stationId={station.id} />
      <SearchBox spotifyToken={spotifyToken} stationId={station.id} />
      <PlayList stationId={station.id} />
    </div>
  );
}

interface IParams extends ParsedUrlQuery {
  id: string;
}

export const getStaticProps: GetStaticProps = async (context) => {
  const {id} = context.params as IParams;
  const {error, data} = await client.query<Query>({
    query: GET_STATION_LIST,
    variables: {id},
  });
  return {
    props: {
      station: data.stations[0],
    },
  };
};

export async function getStaticPaths() {
  const {error, data} = await client.query<Query>({query: GET_STATION_LIST});
  const paths = data
    ? data.stations.map(({id}) => ({params: {id: id + ''}}))
    : [];
  return {
    paths,
    fallback: false,
  };
}