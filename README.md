Btsync-saas Server
======================

Rest api for Btsync-saas


Api ressources
---------------------

 - `Users` : users profiles
 - `Directories` : shared folders
 
### Users
    
get User profile

    GET /users/:id
    
greate a news user

    POST /users/:id/:password

get api token (login)

    GET /users/:id/:password

### Directories

get user shared directories

    GET /users/:id/directories/
    
get infromation from a specific user shared directory

    GET /users/:id/directories/:secret
    
create a new shared folder with a generated secet for the user

    POST /users/:id/directories/

Connect user account to an existing shared folder

    POST /users/:id/directories/:secret
