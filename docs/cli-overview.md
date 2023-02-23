---
id: overview-cli
title: Overview of Buf CLI
sidebar_label: Overview
sidebar_position: 1
slug: /manuals/cli/overview
---

Buf is a helpful tool for managing Protobuf schemas. It offers various features, including code generation, breaking
change detection, linting, and formatting, to assist with Protobuf development and maintenance.

Buf is designed to integrate with your existing workflow to make schema-driven development easier, regardless of project size.

import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

<Tabs
defaultValue="included"
values={[
{label: "What's included in the Buf CLI", value: 'included'},
{label: 'What are the key features of the Buf CLI?', value: 'features'},
]}>
<TabItem value="included">

* `build` - Build Protobuf files into a Buf image
* `generate` - Generate code with protoc plugins
* `breaking` - Verify no breaking changes have been made
* `curl` - Invoke an RPC endpoint, a la 'cURL'
* `lint` - Run linting on Protobuf files
* `format` - Format Protobuf files
* `convert` - Convert a message from binary to JSON or vice versa
* `mod`, `registry`, `push` & `export` for all your Buf Schema Registry needs

</TabItem>
<TabItem value="features">

* Allows you to build Protobuf files into a Buf image.
* Generate code using protoc plugins, which can save time and simplify development.
* Ensure that changes do not cause compatibility issues, you can verify that no breaking changes have been made.
* Invoke an RPC endpoint, similar to using 'cURL', which allows you to test your API.
* The Buf CLI also includes linting and formatting tools, which help keep your Protobuf files clean and consistent.
* Convert a message from binary to JSON or vice versa, which can be useful when debugging or testing.

</TabItem>
</Tabs>

Buf CLI works with your choice of plugins and languages and gives you access to a vast library of certified plugins in
the Buf Schema Registry.  With these features, the Buf CLI provides a comprehensive solution for Protobuf development 
and maintenance.

import { Card, Cards } from "@site/src/components/Cards";

<Cards>
  <Card
    image=""
    name="⚡️ Install Buf"
    url="/installation"
    description="On Mac, Windows or Linux"
  />
  <Card
    image=""
    name="👨‍💻 Explore Buf"
    url="/build/explanation"
    description="Explore essential functions of Buf CLI"
  />
  <Card
    image=""
    name="🚀 Getting Started with the Buf CLI"
    url="/tutorials/getting-started-with-buf-cli"
    description="Learn Buf basics and the benefits of Schema Driven Development"
  />
  <Card
    image=""
    name="🔎 Reference"
    url="/reference/cli/buf"
    description="Find information on CLI features"
  />
</Cards>
