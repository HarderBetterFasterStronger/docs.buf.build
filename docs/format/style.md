---
id: style
title: Format your proto files
---

> We recommend completing [the tour](/tutorials/getting-started-with-buf-cli) for an
> introduction to the `buf format` command.

One of Buf's primary goals is to enforce consistency across all of Protobuf. The
[linter](../lint/overview.md) ensures that the APIs themselves conform to a
strong set of standards, but these standards have nothing to do with the
structure of the `.proto` source file itself. That's where `buf format` comes
in.

## Key Concepts

### Structure

Every `.proto` file is formatted in the following order:

- Syntax
- Package
- Imports (sorted)
- Options (sorted)
- Types

Each of these categories are separated by a single newline like so:

```protobuf
// -- Syntax --
syntax = "proto3";

// -- Package --
package acme.pet.v1;

// -- Imports --
import "acme/payment/v1alpha1/payment.proto";
import "google/protobuf/timestamp.proto";
import "google/type/datetime.proto";

// -- Options --
option cc_enable_arenas = true;
option deprecated = true;

// -- Types --
enum PetType {
  PET_TYPE_UNSPECIFIED = 0;
  PET_TYPE_CAT = 1;
  PET_TYPE_DOG = 2;
  PET_TYPE_SNAKE = 3;
  PET_TYPE_HAMSTER = 4;
}

message Pet {
  PetType pet_type = 1;
  string pet_id = 2;
  string name = 3;
  google.type.DateTime created_at = 4;
  google.protobuf.Timestamp timestamp = 5;
}
```

### Indentation

When necessary, lines are indented by 2 spaces. The level of indentation
increases whenever the line moves from a type to its children (e.g. moving from
a message declaration to its fields).

```protobuf
syntax = "proto3";

package object.v1;

message Object {
  // The fields are indented two spaces from its parent message declaration.
  string id = 1;

  // Nested messages are indented at the same level.
  message Nested {
    // The nested message's field is indented an additional two spaces.
    string id = 1;
  }
}
```

### Comments & Newlines

All comments are preserved, and multiple adjacent newlines are consolidated into
a single line.

```protobuf
syntax = "proto3";

package object.v1;

// Object is a generic message type.
message Object {
  // id uniquely identifies the object.
  string id = 1; // It has field number '1'.

  // value can be set to any arbitrary set of bytes.
  bytes value = 2; // It has field number '2'.
}
```

### Custom Options

Comments are preserved in custom options, too.

```protobuf
syntax = "proto2";

package list.v1;

// Leading comment on (list).
option (list) = {
  names: [
    // This list only has one value.
    "Name"
  ],

  values: [
    // Leading comment on '-42'.
    -42, // Trailing on '-42'.

    // Leading comment on '-43'.
    -43 // Trailing on '43'.
  ],

  recursive: [
    {
      // Leading comment on values key.
      values: [
        -44,
        45
      ]
    }
  ]
};

extend google.protobuf.FieldOptions {
  optional List list = 80000;
}

message List {
  repeated string names = 1;
  repeated sint32 values = 2;
  repeated List recursive = 3;
}
```

### Composite Types

There are several elements that will always be written across multiple lines.
Aside from the ones we see most frequently (messages, enums, etc), this includes
arrays, message literals, and adjacent strings.

```protobuf
syntax = "proto3";

package object.v1;

import "custom/v1/custom.proto";

option (custom.description) =
"This is an example of a single string that can be written across multiple"
    "lines. Like comments, this helps to write long descriptions in a single string."

option (custom.object) = {
  id: "123",
  value: "456
}

option (custom.list) = {
  values: [
    1,
    2
  ]
}
```

### Empty Composite Types

If a composite type (e.g. a `message`) is empty, it will be consolidated into a
single line. However, if the message has comments within it, they will be
preserved.

```protobuf
message Empty {} // This message is written in a single line.

message Foo {
  // This message has a single comment.
}

message Bar {
  // This message has comments spread
  // across multiple lines.
}
```

### Compact Options

If a type has a single compact option, it will be formatted in-line. Otherwise,
the compact options will span multiple lines.

```protobuf
syntax = "proto3";

package object.v1;

message Object {
  string id = 1 [deprecated = true];

  bytes value = 2 [
    deprecated = true,
    ctype = CORD
  ];
}
```

### Usage

The `buf format` command rewrites `.proto` files in-place according to an opinionated [style](style.md).

The `buf format` command has no configuration options. There's only one way to format `.proto` files, so that
every `.proto` file looks and feels the same way. Stop wasting time and energy on deciding how `.proto` files ought to
be formatted - `buf` decides for you so you don't have to.

### Examples

By default, the [input](../reference/inputs.md) is the current directory and the formatted content is written to stdout.
For example, given the following `tree`:

```sh
.
└── proto
    ├── buf.yaml
    └── simple
        └── v1
            └── simple.proto
```

```protobuf title="proto/simple/v1/simple.proto"
syntax = "proto3";

package simple.v1;

message Object {
  string key = 1;
  bytes value = 2;
}
```

```terminal
# Write the current directory's formatted content to stdout
$ buf format
---
syntax = "proto3";

package simple.v1;

message Object {
  string key = 1;
  bytes value = 2;
}
```

Rewrite the file(s) in-place with `-w`. For example,

```terminal
# Rewrite the files defined in the current directory in-place
$ buf format -w
$ cat proto/simple/v1/simple.proto
---
syntax = "proto3";

package simple.v1;

message Object {
  string key = 1;
  bytes value = 2;
}
```

> Most people will want to use 'buf format -w'.

Display a diff between the original and formatted content with `-d`. For
example,

```terminal
# Write a diff instead of the formatted file
$ buf format -d
---
diff -u proto/simple/v1/simple.proto.orig proto/simple/v1/simple.proto
--- proto/simple/v1/simple.proto.orig    ...
+++ proto/simple/v1/simple.proto         ...
@@ -2,8 +2,7 @@

 package simple.v1;

-
 message Object {
-    string key = 1;
-   bytes value = 2;
+  string key = 1;
+  bytes value = 2;
 }
```

You can also use the `--exit-code` flag to exit with a non-zero exit code if
there is a diff:

```terminal
$ buf format --exit-code
$ buf format -w --exit-code
$ buf format -d --exit-code
```

Format a file, directory, or module reference by specifying an input. For
example,

```terminal
# Write the formatted file to stdout
$ buf format proto/simple/v1/simple.proto
---
syntax = "proto3";

package simple;

message Object {
  string key = 1;
  bytes value = 2;
}
```

```terminal
# Write the formatted directory to stdout
$ buf format simple
---
...
```

```terminal
# Write the formatted module reference to stdout
$ buf format buf.build/acme/petapis
---
...
```

Write the result to a specified output file or directory with `-o`. For example,

```terminal
# Write the formatted file to another file
$ buf format proto/simple/v1/simple.proto -o formatted/simple.formatted.proto
```

```terminal
# Write the formatted directory to another directory, creating it if it doesn't exist
$ buf format proto -o formatted
```

```terminal
# This also works with module references
$ buf format buf.build/acme/weather -o formatted
```

Rewrite the file(s) in-place with `-w`. For example,

```terminal
# Rewrite a single file in-place
$ buf format simple.proto -w
```

```terminal
# Rewrite an entire directory in-place
$ buf format proto -w
```

```terminal
# Write a diff and rewrite the file(s) in-place
$ buf format simple -d -w
diff -u proto/simple/v1/simple.proto.orig proto/simple/v1/simple.proto
---
...
```

> The -w and -o flags cannot be used together in a single invocation.

## Conclusion

Formatting your Protobuf files using a consistent and standardized style is a critical aspect of ensuring the
readability and maintainability of your codebase. `buf format` provides a simple and powerful solution for enforcing a
consistent style across all of your Protobuf files. By following the guidelines outlined in this document, you can learn
how to customize your formatting rules, configure your `buf format` settings, and integrate this tool into your
development workflow. With `buf format`, you can ensure that your Protobuf files are easy to read, easy to maintain, and
adhere to industry best practices. 

Remember to incorporate formatting into your development workflow, and
continuously refine your approach to improve the overall quality of your codebase. You can achieve this in CI with the
following guides:

- [CI/CD Setup](/ci-cd/setup)
- [GitHub Actions](/ci-cd/github-actions)