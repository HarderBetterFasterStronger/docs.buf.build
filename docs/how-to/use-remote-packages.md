---
id: use-remote-packages
title: "Supercharge your project with remote packages"
---

This guide will show you how to use Buf's Go Module Proxy to import Go/gRPC client and server stubs as you would for any
other Go library. This will reduce the code generation process to two steps: buf push and go get (or go mod tidy).
Remote Packages make it so that you do not have to worry about Protobuf code generation at all. You can push modules to
the BSR and install generated code stubs from those modules using dependency management tools such as npm and go.

:::note
This guide assumes that you are already familiar with using Protobufs with Buf to generate client/server stubs.
If you are not yet at this stage, we recommend that you check out our [Getting Started guides](../tutorials/getting-started-with-buf-cli.md).
:::

## Remote packages

You can use Remote Packages to depend on gRPC client and server stubs by modifying import paths to use the BSR Go
module proxy. The Go module path you need to use is derived from the name of the module you want to generate for and the
name of the plugin you want to generate with. For example, with the module `buf.build/<BUF_USER>/petapis` and plugin
`buf.build/grpc/go`, the import path would be `buf.build/gen/go/<BUF_USER>/petapis/grpc/go`.

Here are the steps you can take to supercharge your development with Remote Packages:

## Before you begin

It's always a good idea to check if the locally installed version of `buf` is up-to-date. Open your shell and make sure
you have the correct version installed.

```terminal
$ buf --version
---
1.14.0
```

## 1 Push a module

If you haven't already done so, [sign up][sign-up] for the Buf Schema Registry, [create a repository][create-repo]
and [push your module][push-module] to take advantage of everything the BSR has to offer.

## 2 Remove `buf.gen.yaml` {#remove-bufgenyaml}

Without remote packages, you will need to generate your client stubs off of a protobuf file in your project. Now,
remove `buf.gen.yaml` and the generated code in the `gen` directory since you won't need to generate or maintain any
code anymore.

```sh
rm buf.gen.yaml
rm -r gen
```

As expected, if you try to recompile your Go program, you'll notice a compilation error... this is expected:

```terminal
$ go build ./...
---
client/main.go:10:2: no required module provides package github.com/bufbuild/buf-tour/petstore/gen/proto/go/pet/v1; to add it:
	go get github.com/bufbuild/buf-tour/petstore/gen/proto/go/pet/v1
```

## 3 Depend on `buf.build/gen/go` {#depend-on-bufbuildgengo}

Update your import paths to point to your BSR-powered Remote Package.

The [Go module path](/bsr/remote-packages/overview.mdx#the-go-module-path) you need to use is derived from the name of
the module you want to generate _for_and the name of the plugin you want to generate _with_:

import Image from "@site/src/components/Image";
import Syntax from "@site/src/components/Syntax";

<Syntax
title="Go module path syntax"
examples={["buf.build/gen/go/$BUF_USER/petapis/grpc/go"]}
segments={[
{ label: "buf.build/gen/go", kind: "constant" },
{ separator: "/" },
{ label: "moduleOwner", kind: "variable" },
{ separator: "/" },
{ label: "moduleName", kind: "variable" },
{ separator: "/" },
{ label: "pluginOwner", kind: "variable" },
{ separator: "/" },
{ label: "pluginName", kind: "variable" }
]}
/>

With the module `buf.build/$BUF_USER/petapis` and plugin `buf.build/grpc/go`, for example, the import path looks like
this:

```
buf.build/gen/go/$BUF_USER/petapis/grpc/go
```

:::tip
View the extensive library of [Buf plugins][plugins] or visit the `assets` tab of your BSR repository.
:::

Update your import paths accordingly:

```diff title="client/main.go" {8-12}
 package main

 import (
     "context"
     "fmt"
     "log"

-    // This import path is based on the name declaration in the go.mod,
-    // and the gen/proto/go output location in the buf.gen.yaml.
-    petv1 "github.com/bufbuild/buf-tour/petstore/gen/proto/go/pet/v1"
+    petv1 "buf.build/gen/go/$BUF_USER/petapis/protocolbuffers/go/pet/v1"
+    "buf.build/gen/go/$BUF_USER/petapis/grpc/go/pet/v1/petv1grpc"
     "google.golang.org/grpc"
 )
```

Once you've fixed up all your import paths from pointing to your locally/checked in generated code to your BSR-powered
Remote Packages. Run the `go mod tidy` command, which should resolve the remote package successfully.

```terminal
go mod tidy
---
go: finding module for package buf.build/gen/go/$BUF_USER/petapis/protocolbuffers/go/pet/v1
go: finding module for package buf.build/gen/go/$BUF_USER/petapis/grpc/go/pet/v1/petv1grpc
go: found buf.build/gen/go/$BUF_USER/petapis/grpc/go/pet/v1/petv1grpc in buf.build/gen/go/$BUF_USER/petapis/grpc/go v1.2.0-20220907172654-7abdb7802c8f.4
go: found buf.build/gen/go/$BUF_USER/petapis/protocolbuffers/go/pet/v1 in buf.build/gen/go/$BUF_USER/petapis/protocolbuffers/go v1.28.1-20220907172654-7abdb7802c8f.4
```

## 4 Run your application {#run-your-application}

You can run the application again to verify that the remote package works as expected. Everything works just as before,
but you no longer have _any_ locally generated code:

### 4.1 Updating versions {#updating-versions}

If you update your module and push it, you can run `go get` to update the dependency version.

```terminal
$ go mod tidy
```

```diff title="go.sum" {1-4}
- buf.build/gen/go/acme/petapis/grpc/go v1.2.0-20210812172254-4514ddced058.4 h1:QREnaHDWmv55R7nL3buUIRfHH9dSkmPXTenFz1LUUZ4=
- buf.build/gen/go/acme/petapis/grpc/go v1.2.0-20210812172254-4514ddced058.4/go.mod h1:txlj4LYzQXieGG4fYs7419d7Mbh6Vp/32ZRkfZwaUMc=
+ buf.build/gen/go/acme/petapis/grpc/go v1.2.0-20221114162513-4e6df5753af7.4 h1:lCa/8gUpxGfzYpd9gdkriJUd8YospXHonFySS9LkCzI=
+ buf.build/gen/go/acme/petapis/grpc/go v1.2.0-20221114162513-4e6df5753af7.4/go.mod h1:RNC72B+4E2y6/h5H+SDM4J1VOdSiOPBzqCyr7kOdhvw=
```

## Conclusion

Using Buf's Go Module Proxy to import Go client and server stubs is a convenient way to reduce the
code generation workflow to just two steps: `buf push` and `go get`. By leveraging the power of Buf and remote packages, 
you can simplify your development process and focus on building your applications without having to worry about managing
locally generated code.

[modules]: /bsr/overview.mdx#modules

[sign-up]: https://buf.build/signup

[create-repo]: /bsr/overview.mdx#push-a-module

[bsr]: /bsr/overview.mdx

[push-module]: /bsr/overview.mdx#push-a-module

[plugins]: https://buf.build/plugins