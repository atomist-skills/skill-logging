# `@atomist/skill-logging`

Simple API to log into the Skill Audit log stream.

## Usage

To use the Skill Audit log create and use a `Logger` as follows:

```javascript
import { createLogger, Severity } from "@atomist/skill-logging";

const logger = createLogger({
    correlationId: "correlationId from the incoming command or event payload",
});

// Send an audit message
await logger.log("My audit log message");

// Send a warning audit log message
await logger.log("Some warning message", Severity.Warning);
```

## Contributing

Contributions to this project from community members are encouraged
and appreciated. Please review the [Contributing
Guidelines](CONTRIBUTING.md) for more information. Also see the
[Development](#development) section in this document.

## Code of conduct

This project is governed by the [Code of
Conduct](CODE_OF_CONDUCT.md). You are expected to act in accordance
with this code by participating. Please report any unacceptable
behavior to code-of-conduct@atomist.com.

## Documentation

Please see [docs.atomist.com][atomist-doc] for
[developer][atomist-doc-sdm] documentation.

-   API documentation for this project: [@atomist/sdm TypeDoc][typedoc]
-   List of third-party OSS licenses used in this project: [@atomist/sdm OSS licenses][licenses]

[atomist-doc-sdm]: https://docs.atomist.com/developer/sdm/ "Atomist Documentation - SDM Developer"
[typedoc]: https://atomist.github.io/sdm/ "@atomist/sdm TypeDoc"
[licenses]: legal/THIRD_PARTY.md "@atomist/sdm Third-Party Licenses"

## Connect

Follow [@atomist][atomist-twitter] and [The Composition][atomist-blog]
blog related to SDM.

[atomist-twitter]: https://twitter.com/atomist "Atomist on Twitter"
[atomist-blog]: https://the-composition.com/ "The Composition - The Official Atomist Blog"

## Support

General support questions should be discussed in the `#support`
channel in the [Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/sdm/issues

## Development

You will need to install [Node.js][node] to build and test this
project.

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

Releases are handled via the [Atomist SDM][atomist-sdm]. Just press
the 'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]: https://github.com/atomist/atomist-sdm "Atomist Software Delivery Machine"

---

Created by [Atomist][atomist].
Need Help? [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ "Atomist - How Teams Deliver Software"
[slack]: https://join.atomist.com/ "Atomist Community Slack"
