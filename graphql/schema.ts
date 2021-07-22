import {makeSchema, nullable, objectType, queryType, extendType} from 'nexus';
import {join} from 'path';
import {format, max} from 'date-fns';
import {Station as StationModel} from '.prisma/client';
import {Context} from './context';

const Query = queryType({
  definition(t) {
    t.list.field('albums', {
      type: 'Album',
      args: {
        first: 'Int',
      },
      resolve(_root, args, ctx) {
        return ctx.prisma.album.findMany({take: args.first});
      },
    });

    t.list.field('stations', {
      type: 'Station',
      args: {
        id: nullable('ID'),
      },
      resolve(_root, args, ctx) {
        if (args.id) {
          return ctx.prisma.station.findMany({where: {id: parseInt(args.id)}});
        } else {
          return ctx.prisma.station.findMany();
        }
      },
    });

    t.list.field('tracks', {
      type: 'Track',
      args: {
        stationId: 'ID',
      },
      resolve(_root, args, ctx) {
        return ctx.prisma.track.findMany({
          where: {stationId: parseInt(args.stationId)},
        });
      },
    });
  },
});

const TrackMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('createTrack', {
      type: 'Track',
      args: {
        stationId: 'ID',
        name: 'String',
        lengthInSeconds: 'Int',
        spotifyURI: nullable('String'),
      },
      async resolve(_root, args, ctx) {
        const station = await ctx.prisma.station.findUnique({
          where: {id: parseInt(args.stationId)},
        });
        return ctx.prisma.track.create({
          data: {
            stationId: parseInt(args.stationId),
            spotifyURI: args.spotifyURI,
            playAt: await calculateNewTrackPlayAt(station!, ctx),
            name: args.name,
            lengthInSeconds: args.lengthInSeconds,
          },
        });
      },
    });
  },
});

async function calculateNewTrackPlayAt(station: StationModel, ctx: Context) {
  const now = new Date();
  const lastTrack = await ctx.prisma.track.findFirst({
    where: {stationId: station.id},
    orderBy: {playAt: 'desc'},
  });
  if (lastTrack === null) {
    return now;
  }
  const lastTrackEndsAt = new Date(lastTrack.playAt);
  // Add one second to add a little buffer between tracks.
  // We don't want to chop off the last moment of one song to start the next one
  lastTrackEndsAt.setSeconds(
    lastTrackEndsAt.getSeconds() + lastTrack.lengthInSeconds + 1,
  );
  return max([lastTrackEndsAt, now]);
}

const Artist = objectType({
  name: 'Artist',
  definition(t) {
    t.int('id');
    t.string('name');
    t.string('url');
  },
});

const Album = objectType({
  name: 'Album',
  definition(t) {
    t.int('id');
    t.string('name');
    t.string('year');
    t.field('artist', {
      type: 'Artist',
      async resolve(album, _args, ctx) {
        const artist = await ctx.prisma.artist.findFirst({
          where: {id: album.artistId},
        });
        // The ! tells TypeScript to trust us, it won't be null
        return artist!;
      },
    });
  },
});

const Station = objectType({
  name: 'Station',
  definition(t) {
    t.id('id');
    t.string('name');
    t.field('meta', {
      type: 'StationMeta',
      async resolve(station, _args, ctx) {
        return {name: station.name};
      },
    });
  },
});

const StationMeta = objectType({
  name: 'StationMeta',
  definition(t) {
    t.string('name');
  },
});

const Track = objectType({
  name: 'Track',
  definition(t) {
    t.id('id');
    t.nullable.string('spotifyURI');
    t.field('playAt', {
      type: 'String',
      async resolve(track) {
        return track.playAt.toISOString();
      },
    });
    t.string('name');
    t.int('lengthInSeconds');
  },
});

export const schema = makeSchema({
  types: [Query, TrackMutation, Artist, Album, Station, StationMeta, Track],
  shouldGenerateArtifacts: process.env.NODE_ENV === 'development',
  outputs: {
    schema: join(process.cwd(), 'graphql', 'schema.graphql'),
    typegen: join(process.cwd(), 'graphql', 'nexus.ts'),
  },
  sourceTypes: {
    modules: [{module: '.prisma/client', alias: 'prisma'}],
    debug: process.env.NODE_ENV === 'development',
  },
  contextType: {
    module: join(process.cwd(), 'graphql', 'context.ts'),
    export: 'Context',
  },
  nonNullDefaults: {
    input: true,
    output: true,
  },
});
