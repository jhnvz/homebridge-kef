# UNDER DEVELOPMENT !!!!!

# Setting source

Options:
- wifi
- bluetooth
- tv
- optical
- coaxial
- analog
- Standby

# Getting status

url `GET /api/getData?roles=value&path=settings%3A%2Fkef%2Fhost%2FspeakerStatus`

response:
```
[
  {
    "kefSpeakerStatus": "standby",
    "type": "kefSpeakerStatus"
  }
]
```

# Getting player data

url `GET /api/getData?roles=value&path=player%3Aplayer%2Fdata`

response:
```
[
  {
    "controls": {
      "pause": true,
      "playMode": {
        "shuffleRepeatAll": true,
        "repeatOne": true,
        "repeatAll": true,
        "shuffle": true,
        "shuffleRepeatOne": true
      },
      "next_": true,
      "seekTime": true,
      "previous": true,
      "seekBytes": true
    },
    "trackRoles": {
      "icon": "http://resources.tidal.com/images/8fa2bb67/13cd/47ed/b2ba/63c3b641d7d4/750x750.jpg",
      "images": {
        "images": [
          {
            "height": 160,
            "width": 160,
            "url": "http://resources.tidal.com/images/8fa2bb67/13cd/47ed/b2ba/63c3b641d7d4/160x160.jpg"
          },
          {
            "height": 320,
            "width": 320,
            "url": "http://resources.tidal.com/images/8fa2bb67/13cd/47ed/b2ba/63c3b641d7d4/320x320.jpg"
          },
          {
            "height": 750,
            "width": 750,
            "url": "http://resources.tidal.com/images/8fa2bb67/13cd/47ed/b2ba/63c3b641d7d4/750x750.jpg"
          }
        ]
      },
      "title": "Unlearn",
      "context": {
        "path": "airable:context:AAAALABBAGQAZAAgAHQAbwAgAFQASQBEAEEATAAgAGYAYQB2AG8AcgBpAHQAZQBzAAAAzABoAHQAdABwAHMAOgAvAC8AOAA0ADQAOAAyADMAOQA3ADcAMAAuAGEAaQByAGEAYgBsAGUALgBpAG8ALwBhAGMAdABpAG8AbgBzAC8AdABpAGQAYQBsAC8AdAByAGEAYwBrAC8AMQA3ADgAMQAyADIAMQAzADQALwBmAGEAdgBvAHIAaQB0AGUAcwAvAGkAbgBzAGUAcgB0AD8AcgA9ACUAMgBGAHQAaQBkAGEAbAAlADIARgBuAGUAdwAlADIARgB0AHIAYQBjAGsAcwAAAEwAYQBpAHIAYQBiAGwAZQA6AC8ALwB0AGkAZABhAGwALwBhAGMAdABpAG8AbgAvAGYAYQB2AG8AcgBpAHQAZQAuAGkAbgBzAGUAcgB0AAAAAAAeAEEAZABkACAAdABvACAAcABsAGEAeQBsAGkAcwB0AAAA2ABoAHQAdABwAHMAOgAvAC8AOAA0ADQAOAAyADMAOQA3ADcAMAAuAGEAaQByAGEAYgBsAGUALgBpAG8ALwBhAGMAdABpAG8AbgBzAC8AdABpAGQAYQBsAC8AdAByAGEAYwBrAC8AMQA3ADgAMQAyADIAMQAzADQALwBwAGwAYQB5AGwAaQBzAHQALwBjAGgAbwBvAHMAZQAvAGkAbgBzAGUAcgB0AD8AcgA9ACUAMgBGAHQAaQBkAGEAbAAlADIARgBuAGUAdwAlADIARgB0AHIAYQBjAGsAcwAAAEwAYQBpAHIAYQBiAGwAZQA6AC8ALwB0AGkAZABhAGwALwBhAGMAdABpAG8AbgAvAHAAbABhAHkAbABpAHMAdAAuAGkAbgBzAGUAcgB0AQA\\="
      },
      "type": "audio",
      "path": "playlists:item/2",
      "value": {
        "type": "i32_",
        "i32_": 1
      },
      "quality": [
        "low",
        "high",
        "lossless",
        "hires"
      ],
      "mediaData": {
        "metaData": {
          "contentPlayContextPath": "airable:playContext:https://8448239770.airable.io/id/tidal/track/178122134",
          "prePlayTimeOffset": 0,
          "prePlayPath": "airable:preplay\\?serviceType\\=tidal&dataType\\=track&objectId\\=178122134",
          "contentStateChangePath": "airable:statechange",
          "album": "FRIENDS KEEP SECRETS 2",
          "playLogicPath": "playlists:playlogic",
          "maximumRetryCount": 4,
          "serviceID": "tidal",
          "prePlayData": "AAAABAAAAHYAaAB0AHQAcABzADoALwAvADgANAA0ADgAMgAzADkANwA3ADAALgBhAGkAcgBhAGIAbABlAC4AaQBvAC8AdABpAGQAYQBsAC8AcABsAGEAeQAvAG0AcQBhAC8AMgA4ADIAMgAvADEANwA4ADEAMgAyADEAMwA0AAAAeABoAHQAdABwAHMAOgAvAC8AOAA0ADQAOAAyADMAOQA3ADcAMAAuAGEAaQByAGEAYgBsAGUALgBpAG8ALwB0AGkAZABhAGwALwBwAGwAYQB5AC8AZgBsAGEAYwAvADEANAAxADEALwAxADcAOAAxADIAMgAxADMANAAAAHQAaAB0AHQAcABzADoALwAvADgANAA0ADgAMgAzADkANwA3ADAALgBhAGkAcgBhAGIAbABlAC4AaQBvAC8AdABpAGQAYQBsAC8AcABsAGEAeQAvAGEAYQBjAC8AMwAyADAALwAxADcAOAAxADIAMgAxADMANAAAAHQAaAB0AHQAcABzADoALwAvADgANAA0ADgAMgAzADkANwA3ADAALgBhAGkAcgBhAGIAbABlAC4AaQBvAC8AdABpAGQAYQBsAC8AcABsAGEAeQAvAGEAYQBjAC8AMQA5ADIALwAxADcAOAAxADIAMgAxADMANA==",
          "artist": "benny blanco"
        },
        "resources": [
          {
            "nrAudioChannels": 2,
            "codec": "Free Lossless Audio Codec (FLAC)",
            "maxBitRate": 1755214,
            "mqaInfo": {
              "customRateUsed": false,
              "fullStringMqaInfo": "MQA [ 44100Hz  ]",
              "outputSampleRate": 192000,
              "state": "valid",
              "originalSampleRate": 44100,
              "originalBitDepth": 24,
              "originalSampleRateCustom": ""
            },
            "bitRate": 1353352,
            "bitsPerSample": 24,
            "minBitRate": 1057452,
            "uri": "http://ab-pr-fa.audio.tidal.com/ff6fe795668947056d2db1daf2ed77ff_39.flac?token=1616975668~YTI0Y2YxMDNhNjY3NzIxNzg0ZWIxYjJiMjU1NzE5ZTQ0MTlkNzA4MA==",
            "sampleFrequency": 192000,
            "mimeType": "audio/mpeg"
          }
        ]
      },
      "id": "2",
      "containerType": "none"
    },
    "mediaRoles": {
      "title": "PlayQueue tracks",
      "timestamp": 1616969161692,
      "type": "container",
      "path": "playlists:pq/getitems",
      "mediaData": {
        "metaData": {
          "playLogicPath": "playlists:playlogic"
        }
      },
      "containerType": "none"
    },
    "matchingMediaRoles": [],
    "state": "paused",
    "status": {
      "timeSeek": true,
      "byteSeek": true,
      "duration": 154728
    },
    "streamId": 501,
    "playId": {
      "timestamp": 1787276546,
      "systemMemberId": "kef_one-9f86e104-ae34-495d-a2f8-0869c1618d62"
    }
  }
]

mediaRoles.state
```

# Getting source

url `GET /api/getData?path=settings%3A%2Fkef%2Fplay%2FphysicalSource&roles=value`

response:
```
[
  {
    "type": "kefPhysicalSource",
    "kefPhysicalSource": "standby"
  }
]
```

# Getting player state

url `GET /api/getData?path=player%3Aplayer%2Fdata&roles=value`

response:
```
[
  {
    "error2": {},
    "keepActive": false,
    "state": "stopped",
    "error": "",
    "playId": {
      "timestamp": 1741335583,
      "systemMemberId": "kef_one-9f86e104-ae34-495d-a2f8-0869c1618d62"
    }
  }
]
```

# Set source

url: `POST /api/setData`

body:
```
{
  "path": "settings:/kef/play/physicalSource",
  "role": "value",
  "value": {
    "type": "kefPhysicalSource",
    "kefPhysicalSource": "wifi"
  }
}
```

# Setting volume

url: `POST /api/setData`

body:
```
{
  "path": "player:volume",
  "role": "value",
  "value": {
    "type": "i32_",
    "i32_": 18
  }
}
```

# Getting volume

url: `GET /api/getData?roles=value&path=player%3Avolume`

response:
```
[
  {
    "type": "i32_",
    "i32_": 35
  }
]
```

# Getting source

url: `GET /api/getData?path=settings%3A%2Fkef%2Fplay%2FphysicalSource&roles=value`

response:
```
[
  {
    "type": "kefPhysicalSource",
    "kefPhysicalSource": "bluetooth"
  }
]
```

# Getting model

url: `/api/getData?path=settings%3A%2Fkef%2Fhost%2FmodelName&roles=value`

response:
```
[
  {
    "type": "string_",
    "string_": "SP4025"
  }
]
```

# Getting Serial number

url: `/api/getData?roles=value&path=settings%3A%2Fkef%2Fhost%2FserialNumber`

response:
```
[
  {
    "type": "string_",
    "string_": "LSW0205276M46R1G"
  }
]
```
