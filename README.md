# `@atomist/skill-logging`

Simple API to log into the Skill log stream.

This implementation will fall back to `console.log` for environments in which
Google Cloud Logging is not accessible.

## Usage

To use the Skill Log create and use a `Logger` as follows:

```javascript
import { createLogger } from "@atomist/skill-logging";

const logger = createLogger({
    correlationId: "correlationId from the incoming message",
    workspaceId: "workspaceId of incoming message",
    skillId: "skill.id of incoming message",
    eventId: "eventId as passed into the skill via the Pub/Sub attributes",
});

// Send an debug message
logger.debug("My %s log message", "super");

// Close the logger instance to let it purge its internal queue
await logger.close();
```

## Contributing

Contributions to this project from community members are encouraged and
appreciated. Please review the [Contributing Guidelines](CONTRIBUTING.md) for
more information. Also see the [Development](#development) section in this
document.

## Code of conduct

This project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). You are
expected to act in accordance with this code by participating. Please report any
unacceptable behavior to code-of-conduct@atomist.com.

## Documentation

Please see [docs.atomist.com][atomist-doc] for developer documentation.

[atomist-doc]: https://docs.atomist.com/ "Atomist Documentation"

## Connect

Follow [@atomist][atomist-twitter] and the [Atomist blog][atomist-blog].

[atomist-twitter]: https://twitter.com/atomist "Atomist on Twitter"
[atomist-blog]: https://blog.atomist.com/ "The Atomist Blog"

## Support

General support questions should be discussed in the `#help` channel in the
[Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist-skills/skill-logging/issues

## Development

You will need to install [Node.js][node] to build and test this project.

[node]: https://nodejs.org/ "Node.js"

### Build and test

Install dependencies.

```
$ npm install
```

Use the `build` package script to compile, test, lint, and build the
documentation.

```
$ npm run build
```

### Release

Releases are handled via the Atomist Skills. Just push a release semantic
version tag to this repository.

---

Created by [Atomist][atomist]. Need Help? [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ "Atomist"
[slack]: https://join.atomist.com/ "Atomist Community Slack"
