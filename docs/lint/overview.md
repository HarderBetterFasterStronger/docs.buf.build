---
id: overview
title: Enforce Lint Standards
---

Using a [linter][lint] on your Protobuf sources enables you to enforce
consistency and keep your API definitions in line with your chosen best
practices. We recommend enforcing lint [rules](./rules.md) whether you're
working on a small personal project or maintaining a large set of Protobuf
definitions across a major organization, but it's especially important for users
and organizations that continually onboard new engineers who aren't yet
experienced with Protobuf schema design.

The [`buf` CLI][cli] provides linting functionality through the
[`buf lint`](./usage.mdx) command. When you run `buf lint`, `buf` runs a set of
[lint rules](./rules.md) across all the Protobuf files covered by a
[`buf.yaml`](../configuration/v1/buf-gen-yaml.md) configuration file. By
default, the `buf` CLI uses a curated set of lint rules designed to guarantee
consistency and maintainability across Protobuf schemas of any size and
purpose&mdash;but without being so opinionated that it restricts you from making
the design decisions you need to make for your individual APIs.

Some features of the `buf` CLI's linter:

- **[Selectable configuration](#configuration)** of the exact lint rules you
  want, including categorization of lint rules into categories. While we
  recommend using the [`DEFAULT`](./rules.md#default) set of lint rules, you're
  free to go your own way.

- **Editor integration**. The default error output is easily parsed by most
  editors, which allows for a tight feedback loop for lint errors. Currently, we
  provide [Vim and Visual Studio Code integration](../editor-integration.mdx)
  but we may support other editors in the future, such as Emacs and IntelliJ
  IDEs.

- **Speed**. `buf`'s
  [internal Protobuf compiler](../reference/internal-compiler.md) uses all
  available cores to compile your Protobuf schemas while maintaining
  deterministic output. Additionally, it copies files into memory _before_
  processing. As an unscientific example, `buf` can compile all 2,311 `.proto`
  files in [`googleapis`][googleapis] in about 0.8 seconds on a four-core
  machine, while it takes [protoc] 4.3 seconds to do so on the same machine.
  While both are fast, the `buf` CLI provides near-instantaneous feedback, which
  is especially useful for editor integration. `buf`'s speed is directly
  proportional to the input size, so linting a single file only takes a few
  milliseconds.

You can configure the `buf` CLI's linter with a
[`buf.yaml`](../configuration/v1/buf-yaml.md) file at the root of the Protobuf
source files you want to lint. If you run `buf lint` against an
[input](../reference/inputs.md) that contains a `buf.yaml` file, the lint
configuration in that file is used. If the input doesn't contain a `buf.yaml`
file, the `buf` CLI operates _as if_ a `buf.yaml` file with the
[default values](#default-values) were present.

This example config shows all the available configuration options:

```yaml title="buf.yaml"
version: v1
lint:
  use:
    - DEFAULT
  except:
    - FILE_LOWER_SNAKE_CASE
  ignore:
    - bat
    - ban/ban.proto
  ignore_only:
    ENUM_PASCAL_CASE:
      - foo/foo.proto
      - bar
    BASIC:
      - foo
  enum_zero_value_suffix: _UNSPECIFIED
  rpc_allow_same_request_response: false
  rpc_allow_google_protobuf_empty_requests: false
  rpc_allow_google_protobuf_empty_responses: false
  service_suffix: Service
  allow_comment_ignores: true
```

For more info, see the [`buf.yaml` reference](../configuration/v1/buf-yaml.md).

## Options

### `use`

The `use` key is **optional** and lists the IDs or categories to use for
linting. For example, this config applies the [`BASIC`](./rules.md#basic) lint
category and the [`FILE_LOWER_SNAKE_CASE`](./rules.md#file_lower_snake_case)
rule:

```yaml title="buf.yaml"
version: v1
lint:
  use:
    - BASIC
    - FILE_LOWER_SNAKE_CASE
```

The default `use` value is `DEFAULT` as a single item:

```yaml
use:
  - DEFAULT
```

### `except`

The `except` key is **optional** and removes IDs or categories from the `use`
list. For example, this config results in all lint rules in the
[`DEFAULT`](./rules.md#default) lint category being used _except_
[`ENUM_NO_ALLOW_ALIAS`](./rules.md#enum_no_allow_alias) and all lint rules in
the [`BASIC`](./rules.md#basic) category:

```yaml title="buf.yaml"
version: v1
lint:
  use:
    - DEFAULT
  except:
    - ENUM_NO_ALLOW_ALIAS
    - BASIC
```

Note that since `DEFAULT` is the default value for `use`, this is equivalent to
the above:

```yaml title="buf.yaml"
version: v1
lint:
  except:
    - ENUM_NO_ALLOW_ALIAS
    - BASIC
```

### `ignore`

The `ignore` key is **optional** and enables you to exclude directories or files
from all lint rules when running `buf lint`. If a directory is ignored, then all files
and subfolders of the directory will also be ignored. The specified directory or file
paths **must** be relative to the `buf.yaml`. For example, the lint result in
`foo/bar.proto` is ignored with this config:

```yaml title="buf.yaml"
version: v1
lint:
  ignore:
    - foo/bar.proto
```

### `ignore_only`

The `ignore_only` key is **optional** and enables you to exclude directories or
files from specific lint rules when running `buf lint` by taking a map from lint
rule ID or category to path. As with `ignore`, the paths **must** be relative to
the `buf.yaml`

For example, this config sets up specific ignores for the ID `ENUM_PASCAL_CASE`
and the category `BASIC`:

```yaml title="buf.yaml"
version: v1
lint:
  ignore_only:
    ENUM_PASCAL_CASE:
      - foo/foo.proto
      - bar
    BASIC:
      - foo
```

### `allow_comment_ignores`

The `allow_comment_ignores` key is **optional** and turns on comment-driven
ignores.

```yaml title="buf.yaml"
version: v1
lint:
  allow_comment_ignores: true
```

If this option is set, leading comments can be added within Protobuf files to
ignore lint errors for certain components. If any line in a leading comment
starts with `buf:lint:ignore ID`, then `buf` ignores lint errors for this ID.
For example:

```proto
syntax = "proto3";

// buf:lint:ignore PACKAGE_LOWER_SNAKE_CASE
// buf:lint:ignore PACKAGE_VERSION_SUFFIX
package A;
```

**We do not recommend using this.** Buf's goal is to help everyone develop
consistent Protobuf schemas regardless of organization, and for a large
organization it would _not_ be helpful for individual engineers to decide what
should and should not be ignored. This should instead be surfaced in a
repository-wide configuration file such as `buf.yaml`.

If you do have specific items that you want to ignore, we recommended adding the
offending types to a special file, for example `foo_lint_ignore.proto`, and
setting the corresponding `ignore` or `ignore_only`. For example, imagine a
legacy enum that uses `allow_alias`:

```protobuf
enum Foo {
  option allow_alias = true;
  FOO_UNSPECIFIED = 0;
  FOO_ONE = 1;
  FOO_TWO = 1;
}
```

You could place this enum in a file called `foo_lint_ignore.proto` and apply
this lint configuration:

```yaml title="buf.yaml"
version: v1
lint:
  ignore_only:
    ENUM_NO_ALLOW_ALIAS:
      - path/to/foo_lint_ignore.proto
```

We do recognize, however, that there are situations where comment-driven ignores
are necessary, and we want users to be able to make informed decisions, so we
added the `allow_comment_ignores` option. This also has the effect of making it
possible to keep comment-driven ignores disabled. If you have commit checks for
files via an authors/owners file, for example, you can make sure that `buf.yaml`
is owned by a top-level repository owner and prevent `allow_comment_ignores`
from being set, so that `buf` ignores any `buf:lint:ignore` annotations.

### `enum_zero_value_suffix`

The `enum_zero_value_suffix` key is **optional**, and controls the behavior of
the `ENUM_ZERO_VALUE_SUFFIX` lint rule. By default, this rule verifies that the
zero value of all enums ends in `_UNSPECIFIED`, as recommended by the [Google
Protobuf Style Guide][style]. But organizations may have a different preferred
suffix, for example `_NONE`, and `enum_zero_value_suffix` enables you to set a
suffix like this:

```yaml title="buf.yaml"
version: v1
lint:
  enum_zero_value_suffix: _NONE
```

That config allows this:

```protobuf
enum Foo {
  FOO_NONE = 0;
}
```

### `rpc_allow_.*`

The `rpc_allow_same_request_response`,
`rpc_allow_google_protobuf_empty_requests`, and
`rpc_allow_google_protobuf_empty_responses` options are **optional**, and
control the behavior of the `RPC_REQUEST_STANDARD_NAME`,
`RPC_RESPONSE_STANDARD_NAME`, and `RPC_REQUEST_RESPONSE_UNIQUE` lint rules.

**One of the single most important rules to enforce in modern Protobuf
development is to have a unique request and response message for every RPC.**
Separate RPCs should not have their request and response parameters controlled
by the same Protobuf message, and if you share a Protobuf message between
multiple RPCs, this results in multiple RPCs being affected when fields on this
Protobuf message change. **Even in straightforward cases**, best practice is to
always have a wrapper message for your RPC request and response types. `buf`
enforces this as part of the `DEFAULT` category by verifying that:

- All requests and responses are unique across your Protobuf schema.
- All requests and response messages are named after the RPC, either by naming
  them according to one of these:
  - `MethodNameRequest/MethodNameResponse`
  - `ServiceNameMethodNameRequest/ServiceNameMethodNameResponse`

This service definition, for example, abides by these rules:

```protobuf
// request/response message definitions omitted for brevity

service FooService {
  rpc Bar(BarRequest) returns (BarResponse) {}
  rpc Baz(FooServiceBazRequest) returns (FooServiceBazResponse) {}
}
```

But while do **not** recommend it, `buf` provides a few options to loosen these
restrictions somewhat:

- `rpc_allow_same_request_response` allows the same message type to be used for
  a single RPC's request and response type.
- `rpc_allow_google_protobuf_empty_requests` allows RPC requests to be
  [`google.protobuf.Empty`][empty] messages. This can be set if you want to
  allow messages to be void forever, that is, to never take any parameters.
- `rpc_allow_google_protobuf_empty_responses` allows RPC responses to be
  `google.protobuf.Empty` messages. This can be set if you want to allow
  messages to never return any parameters.

The file `google/protobuf/empty.proto` is part of the [Well-Known Types][wkt],
and can be directly included in any Protobuf schema. For example:

```protobuf
syntax = "proto3";

package foo.v1;

import "google/protobuf/empty.proto";

service BarService {
  // NOT RECOMMENDED
  rpc Baz(google.protobuf.Empty) returns (google.protobuf.Empty);
}
```

### `service_suffix`

The `service_suffix` key is **optional**, and controls the behavior of the
`SERVICE_SUFFIX` lint rule. By default, this rule verifies that all service
names are suffixed with `Service`. But organizations may have a different
preferred suffix, for example `API`, and `service_suffix` enables you to set
that suffix explicitly:

```yaml title="buf.yaml"
version: v1
lint:
  service_suffix: API
```

That config allows this:

```protobuf
service FooAPI {}
```

## Default values

If a `buf.yaml` does not exist, or if the `lint` key is not configured, this
default configuration is used:

```yaml title="buf.yaml"
version: v1
lint:
  use:
    - DEFAULT
  enum_zero_value_suffix: _UNSPECIFIED
  rpc_allow_same_request_response: false
  rpc_allow_google_protobuf_empty_requests: false
  rpc_allow_google_protobuf_empty_responses: false
  service_suffix: Service
```

### Other material

import { Card, Cards } from "@site/src/components/Cards";

<Cards>
  <Card
    image=""
    name="🚀️ How to lint & format you Protobuf files"
    url="/lint/usage"
    description="Linting and formatting tools help to maintain the quality of the code by enforcing a set of rules for style, syntax, and best practices. "
  />
  <Card
    image=""
    name="📚 Lint Rules & Categories"
    url="/lint/rules"
    description="Reference the available lint categories, and the individual rules within each category."
  />
</Cards>


[empty]: https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/empty.proto
[style]: https://developers.google.com/protocol-buffers/docs/style#enums
[wkt]: https://developers.google.com/protocol-buffers/docs/reference/google.protobuf
[cli]: ../installation.mdx
[googleapis]: https://github.com/googleapis/googleapis
[lint]: https://en.wikipedia.org/wiki/Lint_(software)
[protoc]: https://github.com/protocolbuffers/protobuf
