# firepoker

[![CircleCI](https://circleci.com/gh/Wizehive/firepoker.svg?style=svg)](https://circleci.com/gh/Wizehive/firepoker)

Agile Planning Poker® powered by Firebase and AngularJS

[https://firepoker.io](https://firepoker.io)

Planning Poker®, also called Scrum poker, is a consensus-based technique for estimating, mostly used to estimate effort or relative size of user stories in software development. In Planning Poker®, members of the group make estimates by playing numbered cards face-down to the table, instead of speaking them aloud. The cards are revealed, and the estimates are then discussed. By hiding the figures in this way, the group can avoid the cognitive bias of anchoring, where the first number spoken aloud sets a precedent for subsequent estimates.

To read more, check out the [Wikipedia](https://en.wikipedia.org/wiki/Planning_poker) page.

## Getting Started

Clone the repository

```
git clone https://github.com/Wizehive/firepoker.git
```

Install NVM if you haven't yet

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
```

Setup your environment to use the supported node version

```
# install the compatible node version
nvm install

# changes terminal session to use the compatible node version
nvm use
```

Install dependencies

```
npm install
```

Install bower and grunt-cli

```
npm install -g bower grunt-cli@0.1.x
```

Install [Bower](https://github.com/bower/bower) dependecies

```
bower install
```

To run the local server

```
grunt server
```

To run unit tests

```
grunt karma:unit
```

## Using Docker

To use Docker, you (obviously) need to have [Docker installed](https://www.docker.com/get-started).

For convenience, all Docker-related commands below are also available as an npm script.

### Development

To start the development environment in Docker and make the app accessible on [http://localhost:8000/](http://localhost:8000/)

```
docker-compose up -d
```

To stop and remove the development container

```
docker-compose down
```

### Testing

To run tests within the Docker container

```
docker-compose run --rm app grunt test
```

### Build

To build a deployment-ready docker container

```
docker build -f docker/Dockerfile -t firepoker .
```

## Contributing

Anyone and everyone is welcome to contribute. Clone the repository and fire your pull requests.

Think you've found a bug or have a new feature to suggest? Let us know! [Open an issue](https://github.com/Wizehive/firepoker/issues).

## Legal and License

Planning Poker® is a registered trademark of [Mountain Goat Software, LLC](https://www.mountaingoatsoftware.com/).

Icon designed by [XOXO](https://thenounproject.com/xoxo/)

FirePoker is released under the MIT license.
