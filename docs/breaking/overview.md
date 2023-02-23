---
id: overview
title: Breaking Change Detection
---

One of the core promises of Protobuf is forwards and backwards compatibility.
But making sure that your Protobuf schema doesn't introduce breaking changes
isn't automatic - there are rules you need to follow to ensure that your schema
remains compatible for its lifetime.

`buf` provides a breaking change detector through `buf breaking`, which runs a
set of [breaking rules](rules.md) across the current version of your entire
Protobuf schema in comparison to a past version of your Protobuf schema. The
rules are selectable, and split up into logical categories depending on the
nature of breaking changes you care about:

- `FILE`: Generated source code breaking changes on a per-file basis, that is
  changes that would break the generated stubs where definitions cannot be moved
  across files. This makes sure that for languages such as C++ and Python where
  header files are included, your source code never breaks for a given Protobuf
  change. This category also verifies wire and JSON compatibility.
- `PACKAGE`: Generated source code breaking changes on a per-package basis, that
  is changes that would break the generated stubs, but only accounting for
  package-level changes. This is useful for languages such as Java (with
  `option java_multiple_files = true;` set) or Golang where it is fine to move
  Protobuf types across files, as long as they stay within the same Protobuf
  package. This category also verifies wire and JSON compatibility.
- `WIRE`: Wire breaking changes, that is changes that would break wire
  compatibility, including checks to make sure you reserve deleted types of
  which re-use in the future could cause wire incompatibilities.
- `WIRE_JSON`: Wire breaking changes and JSON breaking changes, that is changes
  that would break either wire compatibility or JSON compatibility. This mostly
  extends `WIRE` to include field and enum value names.

Other features of `buf`'s breaking change detector include:

- **Selectable configuration** of the exact breaking rules you want, including
  categorization of breaking rules into logical categories. While we recommend
  using the `FILE` set of breaking rules, `buf` enables you to select the exact
  set of rules your organization needs.

- **File references**. `buf`'s breaking change detector produces file references
  to the location of the breaking change, including if a reference moves across
  files between your past and current file versions. For example, if a field
  changes type, `buf` produces a reference to the field. If a field is deleted,
  `buf` produces a reference to the location of the message in the current file.

- **Speed**. `buf`'s
  [internal Protobuf compiler](../reference/internal-compiler.md) utilizes all
  available cores to compile your Protobuf schema, while still maintaining
  deterministic output. Additionally files are copied into memory before
  processing. As an unscientific example, `buf` can compile all 2,311 `.proto`
  files in [googleapis](https://github.com/googleapis/googleapis) in about
  _0.8s_ on a four-core machine, as opposed to about 4.3s for `protoc` on the
  same machine. While both are fast, this provides instantaneous feedback, which
  is especially useful with Editor integration. `buf`'s speed is directly
  proportional to the input size, so linting a single file only takes a few
  milliseconds.

## Configuration

`buf`'s breaking change detector is configured through a
[`buf.yaml`](../configuration/v1/buf-yaml.md) file that is placed at the root of
the Protobuf source files it defines. If `buf breaking` is executed for an
[input](../reference/inputs.md) that contains a `buf.yaml` file, its `breaking`
configuration is used for the given operation.

If a `buf.yaml` file is not contained in the input, `buf` operates as if there
is a `buf.yaml` file with the [default values](#default-values).

Below is an example of all available configuration options. For more information
on the `buf.yaml` configuration, see the
[reference](../configuration/v1/buf-yaml.md).

```yaml title="buf.yaml"
version: v1
breaking:
  use:
    - FILE
  except:
    - RPC_NO_DELETE
  ignore:
    - bat
    - ban/ban.proto
  ignore_only:
    FIELD_SAME_JSON_NAME:
      - foo/foo.proto
      - bar
    WIRE:
      - foo
  ignore_unstable_packages: true
```

### `use`

The `use` key is **optional**, and lists the rules or categories to use for
breaking change detection. For example, this selects the `WIRE` breaking
category, as well as the `FILE_NO_DELETE` rule:

```yaml title="buf.yaml"
version: v1
breaking:
  use:
    - WIRE
    - FILE_NO_DELETE
```

**As opposed to [lint rules](../lint/rules.md), breaking rules are not meant to
be overly customized.** Breaking rules are generally meant to work in unison to
detect a category of breaking change, as opposed to being independent
of each other.

You should usually choose one of these values for `use`:

- `[FILE]` enforces that generated stubs do not break on a per-file basis.
- `[PACKAGE]` enforces that generated stubs do not break on a per-package basis.
- `[WIRE]` enforces that wire compatibility is not broken.
- `[WIRE_JSON]` enforces that wire and JSON wire compatibility are not broken.

See the [overview](overview.md) for a longer description of the purpose of each
category.

The default value is the single item `FILE`, which is what we recommend.

### `except`

The `except` key is **optional**, and removes rules or categories from the `use`
list. **We do not recommend using this option in general**. For example, this
results in all breaking rules in the `FILE` breaking category being used except
for `FILE_NO_DELETE`:

```yaml title="buf.yaml"
version: v1
breaking:
  use:
    - FILE
  except:
    - FILE_NO_DELETE
```

### `ignore`

The `ignore` key is **optional**, and enables you to exclude directories or
files from all breaking rules when running `buf breaking`. If a directory is ignored,
then all files and subfolders of the directory will also be ignored. The specified
directory or file paths **must** be relative to the `buf.yaml`. For example,
breaking changes in `foo/bar.proto` are ignored if you apply this:

```yaml title="buf.yaml"
version: v1
breaking:
  ignore:
    - foo/bar.proto
```

This option can be useful for ignoring packages that are in active development
but not deployed in production, especially alpha or beta packages, and we expect
`ignore` to be commonly used for this case. For example:

```yaml title="buf.yaml"
version: v1
breaking:
  use:
    - FILE
  ignore:
    - foo/bar/v1beta1
    - foo/bar/v1beta2
    - foo/baz/v1alpha1
```

### `ignore_only`

The `ignore_only` key is **optional**, and enables you to exclude directories or
files from specific breaking rules when running `buf breaking` by taking a map
from a breaking rules or categories to paths. As with `ignore`, the paths **must**
be relative to the `buf.yaml`. **We do not recommend this option in general.**

For example, this config sets up specific ignores for the ID `FILE_SAME_TYPE`
and the category `WIRE`:

```yaml title="buf.yaml"
version: v1
breaking:
  ignore_only:
    FILE_SAME_TYPE:
      - foo/foo.proto
      - bar
    WIRE:
      - foo
```

### `ignore_unstable_packages`

The `ignore_unstable_packages` key is **optional**, and ignores packages with a
last component that is one of the unstable forms recognized by
[`PACKAGE_VERSION_SUFFIX`](../lint/rules.md#package_version_suffix):

- `v\d+(alpha|beta)\d*`
- `v\d+p\d+(alpha|beta)\d*`
- `v\d+test.*`

For example, if this option is true, these packages are ignored:

- `foo.bar.v1alpha`
- `foo.bar.v1alpha1`
- `foo.bar.v1beta1`
- `foo.bar.v1test`

## Default values

If a `buf.yaml` does not exist, or if the `breaking` key isn't configured, Buf
uses this default configuration:

```yaml title="buf.yaml"
version: v1
breaking:
  use:
    - FILE
```

### Other Material

import { Card, Cards } from "@site/src/components/Cards";

<Cards>
  <Card
    image=""
    name="🚀️ Mastering Breaking Change Detection: A how-to guide"
    url="/breaking/usage"
    description="Walk through the process of using the Buf CLI to detect breaking changes in your protobuf schemas. "
  />
  <Card
    image=""
    name="📚 Breaking Rules & Categories"
    url="/breaking/rules"
    description="Reference the available categories, and the individual rules within each category."
  />
</Cards>