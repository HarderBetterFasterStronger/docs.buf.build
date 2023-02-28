---
id: overview
title: Generating code with Buf
---

> We recommend completing [the tour](/tutorials/getting-started-with-buf-cli#generate-code) for an
> introduction to the `buf generate` command.

This guide provides information on how to use `buf generate`, our solution to protobuf code generation. This allows you
to generate code from your `.proto` files using plugins that can be customized to fit your needs. We include information
on how to create a [`buf.gen.yaml`][buf-gen-yaml] file that serves as a template for your plugins, as well as how to use various
flags and options to customize the generation process. Additionally, it covers how to specify input paths and modules,
and provides examples on how to generate code stubs using specific templates.

## Key Concepts

### What are protoc plugins?

Protoc plugins are external programs that implement a specific interface, defined by the protobuf compiler `protoc`, to
generate code or perform some other custom processing on `.proto` files.

When `protoc` compiles a `.proto` file, it can be configured to invoke a set of plugins to generate additional code or
perform other custom tasks. The plugins can be written in any language, as long as they implement the required protocol
buffer plugin interface.

The protocol buffer plugin interface consists of a set of standard input and output formats, allowing the plugin to
communicate with `protoc`. Specifically, `protoc` invokes the plugin with a list of files to process and the plugin
outputs the generated code to standard output or to files on disk.

Protoc plugins can be used to generate code in various programming languages, enforce coding standards, perform static
analysis, or perform other custom tasks specific to a project or organization.

To use a plugin with `protoc`, the plugin must be installed and available in the system's `$PATH` environment variable.

Invoking `protoc` is needlessly complex and often results in a series of ugly bash scripts checked into a repository
with invocations shared between team members. It's this solution you will first begin to admire about `buf`.

### Configuration

If you are new to generating code using `buf`, you might be wondering how to configure your generation templates and
plugins. This guide provides detailed information about the [`buf.gen.yaml`][buf-gen-yaml] file and plugin configuration.

```yaml title="buf.gen.yaml"
version: v1
plugins:
  - plugin: go
    out: gen/go
    opt: paths=source_relative
    path: custom-gen-go
    strategy: directory
  - plugin: java
    out: gen/java
  - plugin: buf.build/protocolbuffers/python:v21.9
    out: gen/python
```

Before you can generate code using `buf`, you need to define your generation template. The [`buf.gen.yaml`][buf-gen-yaml] file is where
you can specify the version of the generation template, as well as the plugins to run.

* **Version**: The version of the generation template is **required**, and the valid values are `v1beta1` and `v1`.
* **Plugins**: This section allows you to specify the plugins to run. You can define the name of the plugin, the output
  directory, and any options to provide to the plugin.

### Plugins

The name of the plugin is **required**, and by default, `buf` generate will look for a binary named `protoc-gen-NAME` on
your `$PATH`. Alternatively, you can use a remote plugin by specifying the remote plugin name.

* **out**: The relative output directory is **required**.
* **opt**: You can provide any options to the plugin. This can be either a single string or a list of strings and is
  **optional**.
* **path**: The custom path to the plugin binary is **optional** and exclusive with "remote". Most users should not need
  to set this option.
* **strategy**: There are two options for the generation strategy:
    1. `directory`: This is the recommended and default value, and it results in buf splitting the input files by
       directory and making separate plugin invocations in parallel.
    1. `all`: This option will result in buf making a single plugin invocation with all input files. This is needed for
       certain plugins that expect all files to be given at once.

To use the plugin hosted at `buf.build/protocolbuffers/python` at version `v21.9`, simply specify the remote plugin name
and version. If version is omitted, it uses the latest version of the plugin.

:::tip order matters
When specifying multiple plugins in the template, they are invoked in the order they are listed. Each plugin is executed
in parallel per directory, and the results are combined before being written out. The insertion points in the template
are processed in the same order as the plugins are specified.
:::

### Generate Examples

By default, when using buf generate, the tool looks for a file named "buf.gen.yaml" in the current directory. This file
serves as a template that specifies which plugins to invoke. If no source, module, or image argument is provided, the
tool will use the current directory as the default input.

To use "buf.gen.yaml" as the template and the current directory as input, simply run:

```terminal
$ buf generate
```

This is equivalent to specifying the defaults explicitly:

```terminal
$ buf generate --template buf.gen.yaml .
```

Additionally, the --template flag can be used to provide YAML or JSON input directly, without using a file:

```terminal
$ buf generate --template '{"version":"v1","plugins":[{"plugin":"go","out":"gen/go"}]}'
```

To generate code stubs based on a template file named "bar.yaml" from a remote repository, use:

```terminal
$ buf generate --template bar.yaml https://github.com/foo/bar.git
```

To generate code in the "bar/" directory, with the "out" directives in the template prepended with "bar/", use:

```terminal
$ buf generate --template bar.yaml -o bar https://github.com/foo/bar.git
```

Since the paths in the template and the -o flag are relative to the current directory, templates can be placed anywhere.

To generate stubs for a specific subset of input, the --path flag can be used. For example, to generate for only the
files in the directories "proto/foo" and "proto/bar":

```terminal
$ buf generate --path proto/foo --path proto/bar
```

To generate for only the files "proto/foo/foo.proto" and "proto/foo/bar.proto":

```terminal
$ buf generate --path proto/foo/foo.proto --path proto/foo/bar.proto
```

To generate for only the files in the directory "proto/foo" in a remote repository:

```terminal
$ buf generate --template buf.gen.yaml https://github.com/foo/bar.git --path proto/foo
```

It is important to note that all paths must be contained within the same module. For example, if you have a module
named "proto", you cannot specify "--path proto". However, you can specify "--path proto/foo", since "proto/foo" is
contained within "proto".

## Conclusion

`protoc` plugins are extensions to the buf compiler that allow developers to generate custom code based on
Protocol Buffer definitions. These plugins can be used to generate code for any programming language or framework, and
can be used to perform a wide range of tasks.

`buf` provides a simple way to generate code from protobuf definitions using plugins. By creating a [`buf.gen.yaml`][buf-gen-yaml] file
and specifying plugins and options, developers can easily generate code for different languages and frameworks. The
flexibility of `buf` allows developers to customize their code generation by specifying paths and templates. Overall,
Buf provides a seamless experience for automating code generation and reducing development time.

import { Card, Cards } from "@site/src/components/Cards";

<Cards>
  <Card
    image=""
    name="🚀️ Simplify code generation: A how-to guide"
    url="/generate/usage"
    description="Boost Your Productivity with Easy Code Generation using Buf - Learn how right here."
  />
  <Card
    image=""
    name="🚀 Effortless generation with Buf remote plugins: A how-to guide"
    url="/bsr/remote-plugins/usage"
    description="Discover how to use remote plugins in Buf Schema Registry to streamline your Protobuf development."
  />
</Cards>


[buf-gen-yaml]: /configuration/v1/buf-gen-yaml#plugins