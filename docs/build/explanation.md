---
id: explanation
title: Explore Buf Images
---
# Diving deep on Protobuf: building an image

Buf Images are a powerful tool for distributing and sharing compiled Protocol Buffer (Protobuf) schemas across your
organization. They provide a compact and efficient representation of a Protobuf schema, allowing you to easily manage
the evolution of your schema and ensure compatibility across multiple systems.

In this guide, we'll explain what Buf Images are, how they work, and how you can use them in your projects.

## Concepts

### What are Buf Images?

A Buf Image is a binary representation of a compiled Protobuf schema that is optimized for distribution and use in
multiple systems. It is a compact and efficient format that captures the complete state of a Protobuf schema, including
all messages, enums, and services, as well as their relationships to each other.

Buf Images are built from a set of `.proto` files, which define the structure and syntax of your Protobuf schema. When
you
build a Buf Image, the tooling compiles your `.proto` files into a single binary file that can be easily shared and
distributed across your Schema Registry.

Buf Images are designed to be forwards- and backwards-compatible, allowing you to manage the evolution of your schema
over time without breaking compatibility with existing systems. They also include a rich set of metadata, such as source
code locations and comments, that can be used to provide additional context and understanding of your schema.

### How do Buf Images work?

Buf Images are built using the `buf build` command, which compiles your `.proto` files into a single binary file. The
`buf build` command takes as input a buf.yaml file that defines the set of `.proto` files to include in the image and
any additional configuration options.

Once the Buf Image is built, it can be distributed and used in multiple systems, either by copying the binary file or by
publishing it to a repository, such as a artifact repository or version control system.

In order to use a Buf Image in a system, you need to install the Buf tooling and configure your build system to include
the Buf Image in your dependencies. The Buf tooling provides a number of features for working with Buf Images, including
validation, generation of language bindings, and more.

An image is Buf's custom extension to FileDescriptorSets. The actual definition is currently stored in the bufbuild/buf
repo as of this writing.

Buf images are FileDescriptorSets, and FileDescriptorSets are images. Due to the forwards- and backwards-compatible
nature of Protobuf, we add a field to FileDescriptorSet while maintaining compatibility in both directions -
existing Protobuf plugins drop this field, and buf does not require this field to be set to work with images.

Modules are the primitive of Buf, and Buf images represent the compiled artifact of a module. In fact, images contain
information about the module used to create it, which powers a variety of BSR features. For clarity, the Image Protobuf
definition is shown below (notice the ModuleName in the ImageFileExtension):

```protobuf
// Image is an extended FileDescriptorSet.
message Image {
  repeated ImageFile file = 1;
}

// ImageFile is an extended FileDescriptorProto.
//
// Since FileDescriptorProto does not have extensions, we copy the fields from
// FileDescriptorProto, and then add our own extensions via the buf_extension
// field. This is compatible with a FileDescriptorProto.
message ImageFile {
  optional string name = 1;
  optional string package = 2;
  repeated string dependency = 3;
  repeated int32 public_dependency = 10;
  repeated int32 weak_dependency = 11;
  repeated google.protobuf.DescriptorProto message_type = 4;
  repeated google.protobuf.EnumDescriptorProto enum_type = 5;
  repeated google.protobuf.ServiceDescriptorProto service = 6;
  repeated google.protobuf.FieldDescriptorProto extension = 7;
  optional google.protobuf.FileOptions options = 8;
  optional google.protobuf.SourceCodeInfo source_code_info = 9;
  optional string syntax = 12;

  // buf_extension contains buf-specific extensions to FileDescriptorProtos.
  //
  // The prefixed name and high tag value is used to all but guarantee there
  // will never be any conflict with Google's FileDescriptorProto definition.
  // The definition of a FileDescriptorProto has not changed in years, so
  // we're not too worried about a conflict here.
  optional ImageFileExtension buf_extension = 8042;
}

message ImageFileExtension {
  // is_import denotes whether this file is considered an "import".
  optional bool is_import = 1;
  // ModuleInfo contains information about the Buf module this file belongs to.
  optional ModuleInfo module_info = 2;
  // is_syntax_unspecified denotes whether the file did not have a syntax explicitly specified.
  optional bool is_syntax_unspecified = 3;
  // unused_dependency are the indexes within the dependency field on
  // FileDescriptorProto for those dependencies that are not used.
  repeated int32 unused_dependency = 4;
}
```

### Linting and breaking change detection

Linting and breaking change detection internally operate on Buf images that the
`buf` CLI either produces on the fly or reads from an external location. They
represent a stable, widely used method to represent a compiled Protobuf schema.
For the breaking change detector, images are the storage format used if you want
to manually store the state of your Protobuf schema. See the
[input documentation](/reference/inputs.md#breaking-change-detection) for more details.

### Creating images

You can create Buf images using `buf build`. If the current directory contains a
valid [`buf.yaml`](/configuration/v1/buf-yaml.md), you can building an image
with this command:

```sh
$ buf build -o image.bin
```

The resulting Buf image is written to the `image.bin` file. Of note, the
ordering of the `FileDescriptorProto`s is carefully written to mimic the
ordering that `protoc` would produce, for both the cases where imports are and
are not written.

By default, `buf` produces a [Buf image](/reference/images.md) with both
imports and source code info. You can strip each of these:

```sh
$ buf build --exclude-imports --exclude-source-info -o image.bin
```

In general, we do not recommend stripping these, as this information can be
useful for various operations. Source code info, however, takes up a lot of
additional space (generally ~5x more space), so if you know you do not need this
data, it can be useful to strip source code info.

Images can be outputted in one of two formats:

- Binary
- JSON

Either format can be compressed using Gzip or Zstandard.

Per the [Buf input](/reference/inputs.md) documentation, `buf build` can deduce the format
from the file extension:

```sh
$ buf build -o image.bin
$ buf build -o image.bin.gz
$ buf build -o image.bin.zst
$ buf build -o image.json
$ buf build -o image.json.gz
$ buf build -o image.json.zst
```

The special value `-` is used to denote stdout. You can manually set the format.
For example:

```terminal
$ buf build -o -#format=json
```

You can combine this with [jq](https://stedolan.github.io/jq) to introspect the
built image. To see a list of all packages:

```terminal
$ buf build -o -#format=json | jq '.file[] | .package' | sort | uniq | head
---
"google.actions.type"
"google.ads.admob.v1"
"google.ads.googleads.v1.common"
"google.ads.googleads.v1.enums"
"google.ads.googleads.v1.errors"
"google.ads.googleads.v1.resources"
"google.ads.googleads.v1.services"
"google.ads.googleads.v2.common"
"google.ads.googleads.v2.enums"
"google.ads.googleads.v2.errors"
```

Images always include the `ImageFileExtension` field. If you want a pure
`FileDescriptorSet` without this field set, to mimic `protoc` entirely:

```terminal
$ buf build -o image.bin --as-file-descriptor-set
```

The `ImageFileExtension` field doesn't affect Protobuf plugins or any other
operations; they merely see this as an unknown field. But we provide this option
in case you need it.

### Using protoc output as `buf` input

Since `buf` speaks in terms of [Buf images](/reference/images.md) and
[`FileDescriptorSet`][filescriptorset]s are images, we can use`protoc` output as
`buf` input. Here's an example for [`buf lint`](/lint/usage.mdx):

```terminal
$ protoc -I . --include_source_info -o /dev/stdout foo.proto | buf lint -
```

### Protoc lint and breaking change detection plugins

Since `buf` "understands" [`FileDescriptorSet`][filedescriptorset]s, we can
provide plugins [`protoc-gen-buf-lint`](/reference/protoc-plugins.md#lint) and
[`protoc-gen-buf-breaking`](/reference/protoc-plugins.md#breaking) as standard
Protobuf plugins as well.

## Conclusion

In summary, Buf Images are a powerful tool for managing the evolution of your Protobuf schema and ensuring compatibility
across multiple systems. They provide a compact and efficient representation of your schema, along with a rich set of
metadata, and a set of tools for working with your schema.

You can build all Protobuf files from the specified input and output a Buf image using `buf build`.

[codegeneratorrequest]: https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/compiler/plugin.proto#L68

[codegeneratorresponse]: https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/compiler/plugin.proto#L99

[filedescriptorproto]: https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/descriptor.proto#L62

[filedescriptorset]: https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/descriptor.proto

[image-proto]: https://buf.build/bufbuild/buf/docs/main/buf.alpha.image.v1#buf.alpha.image.v1.Image