---
id: bazel
title: Bazel
---

Buf provides official support for the [Bazel][bazel] build tool with
[`rules_buf`][rules_buf], which enables you to:

- [Lint][lint] Protobuf sources using the [`buf_lint_test`](#buf-lint-test)
  rule.
- Perform [breaking change detection][breaking] for Protobuf [Inputs][inputs]
  using the [`buf_breaking_test`](#buf-breaking-test) rule.
- Use the [Gazelle](#gazelle) extension to generate Bazel rules.

## Setup {#rules-setup}

To get started, you need to add a series of imports to your Bazel `WORKSPACE`,

```python title="WORKSPACE"
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "rules_buf",
    sha256 = "523a4e06f0746661e092d083757263a249fedca535bd6dd819a8c50de074731a",
    strip_prefix = "rules_buf-0.1.1",
    urls = [
        "https://github.com/bufbuild/rules_buf/archive/refs/tags/v0.1.1.zip",
    ],
)

load("@rules_buf//buf:repositories.bzl", "rules_buf_dependencies", "rules_buf_toolchains")

rules_buf_dependencies()

rules_buf_toolchains()

load("@rules_proto//proto:repositories.bzl", "rules_proto_dependencies", "rules_proto_toolchains")

rules_proto_dependencies()

rules_proto_toolchains()
```

### Using a specific version of the `rules_proto`

[`rules_proto`][rules_proto] is required to use `rules_buf`. By default,
`rules_buf` automatically loads `rules_proto`, but you can use a specific
version of it by loading it _before_ `rules_buf`. Here's an example:

```python title="WORKSPACE"
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "rules_proto",
    sha256 = "66bfdf8782796239d3875d37e7de19b1d94301e8972b3cbd2446b332429b4df1",
    strip_prefix = "rules_proto-4.0.0",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/refs/tags/4.0.0.tar.gz",
        "https://github.com/bazelbuild/rules_proto/archive/refs/tags/4.0.0.tar.gz",
    ],
)

load("@rules_proto//proto:repositories.bzl", "rules_proto_dependencies", "rules_proto_toolchains")

rules_proto_dependencies()

rules_proto_toolchains()

http_archive(
    name = "rules_buf",
    sha256 = "523a4e06f0746661e092d083757263a249fedca535bd6dd819a8c50de074731a",
    strip_prefix = "rules_buf-0.1.1",
    urls = [
        "https://github.com/bufbuild/rules_buf/archive/refs/tags/v0.1.1.zip",
    ],
)

# Load the other rules_buf assets
```

### Pinning the `buf` version

By default, `rules_buf_toolchains` loads the latest `buf` version. For hermetic
builds pin the `buf` version using the version attribute.

```python title="WORKSPACE" {1-2}
# rules_buf fetches the sha based on the version number, the version is enough for hermetic builds.
-rules_buf_toolchains()
+rules_buf_toolchains(version = "v1.15.0")
```

## Rules

The rules work alongside `proto_library` rules. You can configure `rules_buf`
using a [`buf.yaml`][buf_yaml] configuration file. Export the `buf.yaml` using
`exports_files(["buf.yaml"])` to reference it. For repositories that contain a
[`buf.work.yaml`][buf_work_yaml] that references multiple `buf.yaml` files, you
need to export and reference each `buf.yaml` file independently.

> We recommend using the [Gazelle extension](#gazelle) to generate the following
> rules.

### `buf_dependencies` {#buf-dependencies}

`buf_dependencies` is a [repository rule][repository_rule] that downloads one or
more modules from the [BSR][bsr] and generates build files using Gazelle. [Setup
Gazelle][gazelle_setup] to use this rule. To also use Gazelle to generate this
rule and update `deps` in `proto_library` targets see the
[Dependencies](#gazelle-dependencies) section.

#### Attributes

| Name    | Description                                  | Type                | Mandatory | Default |
| :------ | :------------------------------------------- | :------------------ | :-------- | :------ |
| name    | A unique name for this repository.           | [Name][config_name] | required  |         |
| modules | The module pins `remote/owner/repo:revision` | List of strings     | required  |         |

#### Example

```python title="WORKSPACE"
load("@rules_buf//buf:defs.bzl", "buf_dependencies")

buf_dependencies(
    name = "buf_deps",
    modules = [
        "buf.build/envoyproxy/protoc-gen-validate:dc09a417d27241f7b069feae2cd74a0e",
        "buf.build/acme/petapis:84a33a06f0954823a6f2a089fb1bb82e",
    ],
)
```

```python title="BUILD"
load("@rules_proto//proto:defs.bzl", "proto_library")

# imports "validate/validate.proto"
proto_library(
    name = "foo_proto",
    srcs = ["pet.proto"],
    deps = ["@buf_deps//validate:validate_proto"],
)
```

We recommend using a single `buf_dependencies` rule for each `buf.yaml` file.
The [Gazelle extension](#gazelle-dependencies) does this by default.

### `buf_lint_test` {#buf-lint-test}

`buf_lint_test` is a test rule that lints one or more `proto_library` targets.

**NOTE:** Unused imports cannot be detected due to how the lint plugin captures
warnings ([Issue #32](https://github.com/bufbuild/rules_buf/issues/32)).

#### Attributes

[//]:
  #
  "The table is copied from documentation generated by stardoc: https://github.com/bufbuild/rules_buf/blob/main/buf/README.md "

| Name      | Description                      | Type                           | Mandatory | Default                                          |
| :-------- | :------------------------------- | :----------------------------- | :-------- | :----------------------------------------------- |
| `name`    | A unique name for this target.   | [Name][config_name]            | required  |                                                  |
| `config`  | The [`buf.yaml`][buf_yaml] file. | [Label][config_label]          | optional  | Applies the [default][default_config] `buf.yaml` |
| `targets` | `proto_library` targets to lint  | [List of labels][config_label] | required  |                                                  |

#### Example

```python
load("@rules_buf//buf:defs.bzl", "buf_lint_test")
load("@rules_proto//proto:defs.bzl", "proto_library")

proto_library(
    name = "foo_proto",
    srcs = ["pet.proto"],
    deps = ["@go_googleapis//google/type:datetime_proto"],
)

buf_lint_test(
    name = "foo_proto_lint",
    targets = [":foo_proto"],
    config = "buf.yaml",
)
```

This can be run as:

```sh
$ bazel test :foo_proto_lint
```

We recommend having a single `buf_lint_test` for each `proto_library` target.
The [Gazelle extension](#gazelle) can generate them in the same pattern.

### `buf_breaking_test` {#buf-breaking-test}

`buf_breaking_test` is a test rule that checks one or more `proto_library`
targets for breaking changes. It requires an [image](/reference/images) file to
check against.

#### Attributes

[//]:
  #
  "The table is copied from documentation generated by stardoc: https://github.com/bufbuild/rules_buf/blob/main/buf/README.md "

| Name                   | Description                                                                                                                                           | Type                           | Mandatory | Default                                          |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- | :-------- | :----------------------------------------------- |
| `name`                 | A unique name for this target.                                                                                                                        | [Name][config_name]            | required  |                                                  |
| `against`              | The image file to check against.                                                                                                                      | [Label][config_label]          | required  |                                                  |
| `config`               | The `buf.yaml` file.                                                                                                                                  | [Label][config_label]          | optional  | Applies the [default][default_config] `buf.yaml` |
| `exclude_imports`      | Exclude imports from breaking change detection.                                                                                                       | Boolean                        | optional  | `False`                                          |
| `limit_to_input_files` | Only run breaking checks against the files in the targets. This has the effect of filtering the against image to only contain the files in the input. | Boolean                        | optional  | `True`                                           |
| `targets`              | `proto_library` targets to check for breaking changes                                                                                                 | [List of labels][config_label] | required  | `[]`                                             |

#### Example

```python
load("@rules_buf//buf:defs.bzl", "buf_breaking_test")
load("@rules_proto//proto:defs.bzl", "proto_library")

proto_library(
    name = "foo_proto",
    srcs = ["foo.proto"],
)

buf_breaking_test(
    name = "foo_proto_breaking",
    against = "//:image.bin", # The Image file to check against.
    targets = [":foo_proto"], # The Protobuf library
    config = ":buf.yaml",
)
```

This can be run as:

```terminal
$ bazel test :foo_proto_breaking
```

We recommend having a single `buf_breaking_test` for each `buf.yaml`. For
repositories that contain a `buf.work.yaml` that references multiple `buf.yaml`
files, there needs to be exactly one `buf_breaking_test` for each `buf.yaml`
file.

Alternatively, a single `buf_breaking_test` can be used against each
`proto_library` target. For this to work, `limit_to_input_files` attribute must
be set to `True` as the `against` image file may contain other Protobuf files.
Although this is closer to how Bazel operates, for this particular use case it
is not recommended. See the
[module vs package mode example](#example-module-vs-package-mode) for a concrete
example of the differences.

The [Gazelle extension](#gazelle) can generate `buf_breaking_test` in either
levels of granularity.

#### Image inputs {#image-input}

You can generate an [Image][image] file like this:

```terminal
$ buf build --exclude-imports -o image.bin <input>
```

The `<input>` is often a directory containing a `buf.yaml`, but all of the other
[Input formats](/reference/inputs) are also supported.

We recommend storing the Image file in a `testdata` directory and checking it in
to version control and updating it as needed. In the case of repositories that
follow a versioning scheme like [semver][semver], you can update it on each new
release either manually or with a post-release hook.

As an alternative to checking the Image file into version control, you can use
CI artifacts. Many CI servers, like [Travis CI][travis], enable you to upload
build artifacts to a backend like [S3][s3]. In CI, you can set up a pipeline to
build the Image on each commit and then add those artifacts to your `WORKSPACE`:

```python title="WORKSPACE"
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_file")

# Assuming you're using s3 and bucket is at http://s3-us-east-1.amazonaws.com/bucket/foo/bar
# and COMMIT is a variable storing the commit to compare against
http_file(
    name = "buf_module",
    urls = ["http://s3-us-east-1.amazonaws.com/bucket/foo/bar/images/${COMMIT}/image.bin"],
    sha256 = "...",
)
```

This file can be referenced from `buf_breaking_test`. The commit and sha256 need
to be updated as needed.

> For repositories using [`buf.work.yaml`][buf_work_yaml] that reference
> multiple `buf.yaml` files. A single image file should be maintained for each
> `buf.yaml` file. This is true for both module and package level granularity of
> `buf_breaking_test`.

## Gazelle

[Gazelle][gazelle] is a build file generator for Bazel projects that natively
supports Protobuf. [`rules_buf`][rules_buf] includes a Gazelle extension for
generating [`buf_breaking_test`](#buf-breaking-test) and
[`buf_lint_test`](#buf-lint-test) rules out of [`buf.yaml`][buf_yaml]
configuration files.

### Setup {#gazelle-setup}

Start by [setting up](#rules-setup) `rules_buf`, then set up Gazelle using the
[official instructions][gazelle_setup].

Once Gazelle is set up, add the following snippet at the end of the `WORKSPACE`
file:

```python title="WORKSPACE"
load("@rules_buf//gazelle/buf:repositories.bzl", "gazelle_buf_dependencies")

gazelle_buf_dependencies()
```

Now modify the `BUILD` file with the `gazelle` target to include the `buf`
extension:

```python title="BUILD" {1-2,4-13,17}
-load("@bazel_gazelle//:def.bzl", "gazelle")
+load("@bazel_gazelle//:def.bzl", "gazelle", "gazelle_binary")

+gazelle_binary(
+    name = "gazelle-buf",
+    languages = [
+        # Loads the native proto extension
+        "@bazel_gazelle//language/proto:go_default_library",
+        # Loads the Buf extension
+        "@rules_buf//gazelle/buf:buf",
+        # NOTE: This needs to be loaded after the proto language
+    ],
+)

gazelle(
    name = "gazelle",
+    gazelle = ":gazelle-buf",
)
```

Export the `buf.yaml` file by adding `exports_files(["buf.yaml"])` to the
`BUILD` file.

> Inside Buf [workspaces][workspaces], make sure to export each `buf.yaml` file.

Now run Gazelle

```terminal
$ bazel run //:gazelle
```

This will take care of updating your proto build files, just run `//:gazelle`
whenever proto files are added/removed.

### Dependencies {#gazelle-dependencies}

Gazelle can also be used to generate `buf_dependencies` rules. It imports
dependencies from `buf.lock` files.

Add the following code to the `BUILD` file,

```python title="BUILD"
gazelle(
    name = "gazelle-update-repos",
    args = [
        # This can also be `buf.yaml` and `buf.lock`.
        "--from_file=buf.work.yaml",
        # This is optional but recommended, if absent gazelle
        # will add the rules directly to WORKSPACE
        "-to_macro=buf_deps.bzl%buf_deps",
        # Deletes outdated repo rules
        "-prune",
    ],
    command = "update-repos",
    gazelle = ":gazelle-buf",
)
```

Add the following line of code anywhere after `rules_buf_toolchains` in the
`WORKSPACE` file,

```python title="WORKSPACE"
load("@rules_buf//buf:defs.bzl", "buf_dependencies")
```

Now run Gazelle `update-repos` command

```terminal
$ bazel run //:gazelle-update-repos
```

This will create the file `buf_deps.bzl` with the `buf_deps` macro that loads
the `buf_dependencies` rules. It will also call the macro from the `WORKSPACE`
file.

#### Arguments

| Argument                                                                                                                                                                                   | Mandatory | Default |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- | :------ |
| `-from_file file` <br/><br/> Must be one of `buf.work.yaml`, `buf.yaml`, `buf.lock`. When using `buf.work.yaml` or `buf.yaml` the rule will import from the associated `buf.lock` file(s). | required  |
| `-to_macro macroFile%defName` <br/><br/> Tells Gazelle to write new repository rules into a `.bzl` macro function rather than the `WORKSPACE` file.                                        | optional  | ''      |
| <code>-prune true&#124;false</code> <br/><br/> When true, Gazelle will remove `buf_dependencies` rules that no longer have equivalent `buf.yaml` files.                                    | optional  | `false` |

### Lint

By default, a `buf_lint_test` rule is generated for each of the `proto_library`
rule generated by Gazelle. It will pick up the `buf.yaml` that the Protobuf
package belongs to.

Run this command to list the generated lint rules:

```terminal
$ bazel query 'kind(buf_lint_test, //...)'
```

### Breaking change detection

To run [breaking change detection][breaking] against Protobuf sources, you need
to add a Gazelle [directive][gazelle_directive] that points to an [Image][image]
target to generate breaking change detection rules. Gazelle directives are
top-level comments in Bazel [`BUILD` files][build_files] that provide Gazelle
with configuration.

> Scroll to the section on [Image inputs](#image-input) for instructions on
> maintaining Image files themselves.

Add this Gazelle directive to the top of the `BUILD` file at the root of the
[Buf Module][module], which is the directory with a [`buf.yaml`][buf_yaml] file.

```python title="BUILD"
# gazelle:buf_breaking_against //:against_image_file
```

You can generate `buf_breaking_test` in two different modes:
[module mode](#module-mode) (preferred) and [package mode](#package-mode).

#### Module mode (preferred) {#module-mode}

This is the default and preferred mode. `buf_breaking_test` is generated for
each buf module. The rule will reference all the `proto_library` rules that are
part of a buf module. This way the test can detect if any files are deleted.

Once the `buf_breaking_against` directive is added, run `gazelle`:

```terminal
$ bazel run //:gazelle
```

Run this command to list the generated breaking rules:

```terminal
$ bazel query 'kind(buf_breaking_test, //...)'
```

This mimics running `buf breaking` on a module. This is the most accurate way to
check for breaking changes. However, depending on multiple targets at once is an
anti-pattern in Bazel, so that's why we've provided package mode as an
alternative.

#### Package mode

Package mode generates a `buf_breaking_test` rule for each of the
`proto_library` rule, which lets you test only the `proto_library` that has
changed.

Add this Gazelle directive to switch to package mode:

```python
# gazelle:buf_breaking_mode package
```

Now run Gazelle again:

```terminal
$ bazel run //:gazelle
```

Running this command shows `buf_breaking_test` rules generated in multiple
packages:

```terminal
$ bazel query 'kind(buf_breaking_test, //...)'
```

#### Example: Module vs Package mode

Let's consider a Buf [module][module] with this directory structure:

```terminal
├── buf.yaml
├── BUILD
├── foo
│   └── v1
│       ├── foo.proto
│       └── BUILD
└── bar
    └── v1
        ├── bar.proto
        └── BUILD
```

##### Module mode

A single `buf_breaking_test` rule is generated in `BUILD`. If a breaking change
occurs in either `foo.proto` or `bar.proto` this test will detect it (even if
`foo.proto` is deleted entirely).

Let's break down this scenario,

- A typical CI setup would be to use `bazel test //...` to run tests.
- When `foo.proto` is deleted, Gazelle needs to be run again to update the build
  files.
- This time when Gazelle runs, `buf_breaking_test` rule will have one less
  target: `["bar/v1:bar_proto"]`.
- The CI will run `bazel test //...`.
- The `buf_breaking_test` will detect the missing file and fail.

##### Package mode

`buf_breaking_test` rules are generated in both `foo/v1/BUILD` and
`bar/v1/BUILD` against their respective `proto_library` targets. If a breaking
change occurs in either `foo.proto` or `bar.proto` these tests will detect it.
However, if either `foo.proto` or `bar.proto` is deleted the tests will fail to
detect it.

Let's break down this scenario,

- A typical CI setup would be to use `bazel test //...` to run tests.
- When `foo.proto` is deleted, Gazelle needs to be run again to update the build
  files.
- This time when Gazelle runs, `foo/v1/BUILD` will no longer contain a
  `buf_breaking_test` rule.
- The CI will run `bazel test //...`.
- This will always pass as along with the file the test is also removed.

## Examples

Check out some of the [sample workspaces][examples] that demonstrate usage in
various scenarios.

[bazel]: https://bazel.build
[breaking]: /breaking/overview
[bsr]: /bsr/introduction
[buf_cli]: /installation
[buf_work_yaml]: /configuration/v1/buf-work-yaml
[buf_yaml]: /configuration/v1/buf-yaml
[build_files]: https://docs.bazel.build/versions/main/build-ref.html#BUILD_files
[config_label]: https://bazel.build/docs/build-ref.html#labels
[config_name]: https://bazel.build/concepts/labels
[default_config]:
  https://docs.buf.build/configuration/v1beta1/buf-yaml#default-values
[examples]: https://github.com/bufbuild/rules_buf/tree/main/examples
[exports_files]:
  https://docs.bazel.build/versions/main/be/functions.html#exports_files
[gazelle]: https://github.com/bazelbuild/bazel-gazelle
[gazelle_directive]: https://github.com/bazelbuild/bazel-gazelle#directives
[gazelle_setup]: https://github.com/bazelbuild/bazel-gazelle#setup
[image]: /reference/images
[inputs]: /reference/inputs
[lint]: /lint/overview
[module]: /bsr/overview#module
[repository_rule]: https://bazel.build/rules/repository_rules
[release]: https://github.com/bufbuild/rules_buf/releases
[rules_buf]: https://github.com/bufbuild/rules_buf
[rules_proto]: https://github.com/bazelbuild/rules_proto
[s3]: https://aws.amazon.com/s3
[semver]: https://semver.org
[test]:
  https://docs.bazel.build/versions/main/skylark/rules.html#executable-rules-and-test-rules
[travis]: https://travis-ci.com
[workspaces]: /reference/workspaces
