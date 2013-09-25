Btsync-saas Server
======================

Rest api for Btsync-saas


Api ressources
---------------------

 - `Users` : users profiles
 - `Folders` : shared folders
 
### Users
    
get User profile

    GET /users/:id
    
create a news user

    POST /users/:id/:password

get api token (login)

    GET /users/:id/:password

### Folders

get user shared folders

    GET /users/:id/folders/
    
get infromation from a specific user shared folder

    GET /users/:id/folders/:secret
    
create a new shared folder with a generated secet for the user

    POST /users/:id/folders/

Connect user account to an existing shared folder

    POST /users/:id/folders/:secret
    
Remove a shared folder from btsync-saas

	DEL /users/:id/folders/:secret
