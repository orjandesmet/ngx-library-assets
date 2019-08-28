# ngx-library-assets

Angular builders to include assets from libraries into applications

## Why use this

When changing files within a monorepo, it's best to keep affected projects to a minimum.
Assets for libraries are not automatically copied when building the application that depend on them.
A change to angular.json is mostly ruled as a change affecting every project in the monorepo.
To reduce the need to alter angular.json every time a new library is needed for an application, and to avoid creating 'shared' libraries with assets, this package can be used.
With this package, the libraries can keep their assets in their own source.
Including assets from an existing library into an application is as easy as to update 1 file in that application, making it the only affected application.

## How to use this

1. In angular.json:

* set the builder for the serve target to `ngx-library-assets:dev-server`
* set the builder for the build target to `ngx-library-assets:browser`

2. In your application, add an include.json file inside src/assets

```json
{
  "$schema": "<relative path to node_modules>/ngx-library-assets/include-schema.json",
  "libs": [
    {
      "name": "<name of library>",
      "assetsRoot": "<boolean, optional, default = false>"
    }
  ]
}
```

### name

The name of the Angular project to include assets from.
This should be the name of the project as it is described in angular.json.
If this name is not found in the workspace, a warning will appear in the console.

### assetsRoot

When set to **false** or absent, all assets of that library will be placed in subfolders.
This means, all files will be placed in `/assets/<lib-project-name>` keeping their folder structure.

When set to **true**, all assets of that library, apart from translations will be placed in the assets type root folder.
This means, all files (except folder i18n) will be placed in `/assets/images` keeping their folder structure.
But the content of folder i18n will still be placed in `/assets/<lib-project-name>/i18n`
Be careful that the assets don't have the same names, they will overwrite each other.

## Example

This repository contains an example workspace with a basic Angular application and 2 libraries.
The shared library has option **assetsRoot** set to true.
The my-lib library has option **assetsRoot** absent (default = false).
The application's include.json also mentions an non-existing library, named example-non-existing-lib.
To run the example project, cd into `example` and run `npm install` and then `npm start`.
