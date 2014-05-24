node-tomahawkjs
==========================

Implementation of the JS plugins API from Tomahawk for NodeJS

(This implementation is not fully feature complete compared to the desktop client but [hubot-tomahk](https://github.com/xhochy/hubot-tomahk) is an exmple usage of parts of it)

Usage
-----

### Create a resolver instance

To load a single resolver, we simply use the following code if we know the path to the .axe file:

```javascript
var TomahawkJS = require('tomahawkjs');

TomahawkJS.loadAxe(pathtoaxe, function(err, axe) {
  // TODO: Check for error in err
  // After load the axe, we most likely want to have an instance of the resolver
  axe.getInstance(function(err, instance_context) {
    // TODO: Check for error in err
    var instance = instance_context.instance;
    // Each Resolver instance runs in its own global JavaScript context
    var context = instance_context.context;
    // Start the instance
    // Due to the architecture of the resolveres, this may do some background work and will not block.
    instance.init();
    // We can now use the instance
  });
});
```

### Checking for a capability

As the time of writing, Tomahawk resolvers were all implicitly able to resolve from a combination of Artist and Title (and Albumname) to a stream URL if their feeding service provided this tune. Furthermore there are some other capabilities that can be implemented:

* `browsable`: Resolver exposes a music collection that can be browsed.
* `playlistsync`: Can sync playlists
* `urllookup`: Can resolve from an URL to a combination of Artist+Title/Album/Playlist

Checking for one of these can be done via:

```javascript
context.hasCapability('urllookup')
```

### Resolving

The main functionality of a Tomahawk resolver is to find a stremable URL for a combination of artist and song title and optionally an album.
The requests for resolving should be indentified with a unqiue id for each query.
Alternatively we can search a given string without specifying explicitly artist or title.

```javascript
context.on('track-result', function (qid, result) {
  console.log('Found a new streamable URL for request ' + qid + ':' + result.url);
});

// Search for a streambale URL for song title by artist on album.
instance.resolve(someId1, artist, album, title);

// Search for a streamable URL for a song similar to searchquery
instance.search(someId2, searchquery);
```

### URL Lookup

As an inverse for the lookup of (Artist, Title) -> stream-URL, many resolvers have the `urllookup` capability to resolve from a URL pointing to a music service to artist/album/playlist/.. that is encoded in the URL.

```javascript
// Define a handler for found URL mappings
context.on('url-result', function (url, result) {
  if (result.type == 'track') {
    console.log('Found URL for track ' + result.artist + ' - ' + result.title);
  } else if (result.type == 'album') {
    console.log('Found URL for album ' + result.artist + ' - ' + result.name);
  } else if (result.type == 'playlist') {
    console.log('Found URL for playlist ' + result.title);
  } else if (result.type == 'artist') {
    console.log('Found URL for artist ' + result.name);
  }
});

// Check if resolver has URLLookup capability
if (context.hasCapability('urllookup')) {
  // Can we handle this URL?
  if (instance.canParseUrl(url)) {
    instance.lookupUrl(url);
  }
}
```

### Collection Browsing

Resolver that have the `browsable` capability export the whole collection of music material that can be streamed from them.
The browsing of the collection is done by pulling the relevant information on demand.

```javascript

// Handler for the list of artists (string[])
context.on('artist-results', function (qid, artists) {
  console.log('Got a list of ' + artists.length + ' artists');
  
  // Query the albums for the first artist
  instance.albums(qid + artists[0], artists[0]);
});

// Handler for a list of albums (string[])
context.on('album-results', function(qid, artist, albums) {
  console.log('Got a list of ' + albums.length + ' albums for artist ' + artist);
  
  // Query the first album for all its tracks
  instance.tracks(qid + album, artist, album);
});

// Handler for a list of tracks for an album
content.on('albumtrack-results', function (qid, artist, album, tracks) {
  console.log('Got a list of ' + tracks.length + ' songs on ' + album + ' by ' + artist);
  console.log('The first song is called ' + tracks[0].track);
});


if (context.hasCapability('browsable')) {
  // Get basic information about the collection
  var info = instance.collection();
  // Not all collections support the retrieval of the total number of tracks
  if (info.trackcount == null) {
    console.log('We are browsing the collection ' + info.prettyname + ': ' + info.description);
  } else {
    console.log('We are browsing the collection (' + info.trackcount + ' tracks) ' + info.prettyname + ': ' + info.description);
  }
  
  // Query for the list of all artists
  instance.artists(someQid);
}
```
