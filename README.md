Btsync-saas Server
======================

Rest api for Btsync-saas

Authentification
-----------------

Send auth token in Authorisation header like this

    Authorisation: Basic (:username).base64()

Api ressources
---------------------

 - `Users` : users profiles
 - `Folders` : Shared folders
 
### Users


#### Get User profile

    GET /users/:id

__Authentification :__ yes

__Arguments :__

 - __id (Mandatory GET) :__ User id

__Response Exemple :__

```javascript
{
    id: id
}
```


#### Create new User

    POST /users/:id/create

__Authentification :__ no

__Arguments :__

 - __id (Mandatory GET) :__ User id
 - __password (Mandatory POST) :__ Password


#### Login

    GET /users/:id/login

__Authentification :__ no

__Arguments :__

 - __id (Mandatory GET) :__ User id
 - __password (Mandatory POST) :__ Password

### Folders

#### Get user shared folders


    GET /users/:id/folders/

__Authentification :__ yes

__Arguments :__

 - __id (Mandatory GET) :__ User id


#### Get folder details


    GET /users/:id/folders/:folderId

__Authentification :__ yes

__Arguments :__

 - __id (Mandatory GET) :__ User id
 - __folderId (Mandatory GET) :__ Folder id

#### Create new folder

    POST /users/:id/folders/

__Authentification :__ yes

__Arguments :__

 - __id (Mandatory GET) :__ User id
 - __secret (POST) :__ Folder secret, if not provided a random secret will be generated
 - __name (POST) :__ Folder name
 - __description (POST) :__ Folder description

    
#### Remove a folder

    DEL /users/:id/folders/:folderId

__Authentification :__ yes

__Arguments :__

 - __id (Mandatory GET) :__ User id
 - __folderId (Mandatory GET) :__ Folder id

#### Update a folder

    PUT /users/:id/folders/:folderId

__Authentification :__ yes

__Arguments :__

 - __id (Mandatory GET) :__ User id
 - __folderId (Mandatory GET) :__ Folder id
 - __name (POST) :__ Folder name
 - __description (POST) :__ Folder description