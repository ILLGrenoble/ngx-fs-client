# ngx-fs-client
[![npm version](https://badge.fury.io/js/%40illgrenoble%2Fngx-fs-client.svg)](https://badge.fury.io/js/%40illgrenoble%2Fngx-fs-client)

`ngx-fs-client` is an angular component for connecting to a remote _Node FS Server_. It provides access to a remote filesystem and perform standard file system operations similar to a standard file manager.

The `Node FS Server` runs as a user process on a remote server and provides a simple REST API to access the user's file system (system files are inaccessible). This component can be integrated into an angular app to provide remote access to the user's file system. Due to security concerns the client is not intended to access the server directly but rather use a server-side proxy to manage access/authorisation rights (eg running the FS Server within a micro-service architecture).

As a simple security measure (inefficient for direct public access), the remote server can be configured to only accept requests with a valid `x-auth-token` header. This header should be added in the server proxy (therefore remaining hidden from public network inspection), but for testing purposes the client component can be configured to pass the header too.

It has been built using Angular 16.0.0+ and uses Angular Material for the component library. `ngx-drag-drop` is also required to enable the drag and drop functionality.

![Screenshot](https://raw.githubusercontent.com/ILLGrenoble/ngx-fs-client/master/screenshot.png)

## Features

- Browse and navigate folder contents
- File upload and download
- Drag and Drop files and folders (including external files)
- Cut/Copy/Delete actions
- Create new files and folders
- Rename files and folders

# Installation

To use ngx-fs-client in your project, install it via npm:

```
npm i @illgrenoble/ngx-remote-desktop --save
```

You also need to install the drag-and-drop peer dependency:

```
npm i ngx-drag-drop --save
```

# Usage

Integration into a module:

`app.module.ts`

```
import { NgxFileSysModule } from '@illgrenoble/ngx-fs-client';
// etc.

@NgModule({
    imports: [
        // etc.
        NgxFileSysModule.forRoot({
            basePath: 'files',
            showParentFolder: true,
            accessToken: '1a5bfc34dab9c45bd3a',
        }),
    ],
    declarations: [
        AppComponent,
        // etc.
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}

```

See below for details on the configuration.

Integration into a component template:

`app.component.html`
```
<div>
    <ngx-file-manager></ngx-file-manager>
</div>
```

## Configuration

The configuration for the `NgxFileSysModule` has the following entries:

### `basePath: string`
Requests to the `Node FS Server` are made to the same host as the angular app: a proxy is required to forward the requests to the server. In development mode this can be using the webpack proxy config, eg

```
{
    "/files/*": {
        "target": "http://localhost:8090",
        "secure": false,
        "logLevel": "debug",
        "pathRewrite": {
            "^/files/": "/"
        },
        "changeOrigin": true
    }
}

```

### `showParentFolder: boolean` (optional, default = false)
With this parameter active the parent folder is alays visible in the current folder contents (show as `.. `). This allows for an alternative navigation methods to parent directories and enables dragging and dropping files/folders to the parent folder.

### `accessToken: string` (optional)
If the server is configured with an accessToken, it can be specified here. 

> For security reasons this isn't recommended in production, the accessToken shouldn't be available/visible in the client. Always handle access to the server in the backend along with authentication of the connected user.


