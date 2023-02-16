---
id: introduction
title: What can we help you find?
hide_table_of_contents: true
---

import { Card, Cards } from "@site/src/components/Cards";

<Cards>
  <Card
    image=""
    name="⚡️ Quick Start"
    url="installation"
    description="Download and install Buf on your machine in a few easy steps"
  />
  <Card
    image=""
    name="👨‍💻 Getting Started with the Buf CLI"
    url="/tutorials/getting-started-with-buf-cli"
    description="Learn Buf basics and the benefits of Schema Driven Development"
  />
  <Card
    image=""
    name="🚀 Getting Started with the Buf Schema Registry"
    url="/tutorials/getting-started-with-bsr"
    description="Say hello to confidence, simplicity, and ease of use with the Buf Schema Registry."
  />
  <Card
    image=""
    name="🤝 Getting Started with Connect"
    url="https://connect.build/docs/introduction"
    description="Connect is a family of libraries for building browser and gRPC-compatible HTTP APIs."
  />
</Cards>

### Manuals

<Cards>
  <Card
    image="img/logos/cli.svg"
    name="The Buf CLI"
    url="/build/usage"
    description="Browse through the Buf CLI manuals and lean how to use simplify your protobuf workflow"
  />
  <Card
    image="img/logos/bsr.svg"
    name="The Buf Schema Registry"
    url="/bsr/introduction"
    description="Discover the BSR and the challenges it solves within the Protobuf ecosystem"
  />
</Cards>

import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

<Tabs
defaultValue="explore"
values={[
{label: 'Explore Buf', value: 'explore'},
{label: 'Browse FAQs', value: 'faqs'},
{label: 'Get Support', value: 'support'},
]}>
<TabItem value="explore">

<div class="row">
<div class="col col--6">
<ul>
<li><a href="/reference/images">About Buf Images</a></li>
<li><a href="/bsr/remote-packages/overview">Use Remote Packages</a></li>
<li><a href="/reference/protoc-plugins">Protoc Plugins</a></li>
</ul>
</div>
<div class="col col--6">
<ul>
<li><a href="/generate/usage">Generate Code</a></li>
<li><a href="/bsr/remote-plugins/migrating-from-alpha">Migrating to Remote Packages</a></li>
<li><a href="/reference/cli/buf">Buf CLI</a></li>
</ul>
</div>
</div>

</TabItem>
<TabItem value="faqs">

<div class="row">
<div class="col col--6">
<ul>
<li><a href="/faq#googleapis-failure">googleapis failure</a></li>
<li><a href="/faq#cli-command-or-flag-warnings">CLI command or flag warnings</a></li>
<li><a href="/faq#bufyaml-version">buf.yaml version</a></li>
</ul>
</div>
</div>

</TabItem>
<TabItem value="support">

<div class="row">
<div class="col col--6">
<ul>
<li><a href="https://github.com/bufbuild/buf">Buf Github</a></li>
<li><a href="https://buf.build/links/slack">Buf community Slack</a></li>
<li><a href="/contact">Contact Buf</a></li>
</ul>
</div>
</div>

</TabItem>
</Tabs>
