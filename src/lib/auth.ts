/* =========================================================
   StreamForge Authentication Utility
   SSR SAFE VERSION
   ========================================================= */

export const TOKEN_KEY = "streamforge_token";
export const USER_KEY = "streamforge_user";


const AUTH_KEYS = [
  TOKEN_KEY,
  USER_KEY,
  "streamforge_username",
  "streamforge_email",
  "streamforge_user_id",
  "streamforge_role",
];


/* =========================================================
   STORAGE ACCESS
   SSR SAFE
   ========================================================= */

function getStorages(): Storage[] {

  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  return [
    window.localStorage,
    window.sessionStorage,
  ];
}


/* =========================================================
   TOKEN
   ========================================================= */


export function getToken(): string | null {

  const storages = getStorages();


  for (
    const storage of storages
  ) {

    const token =
      storage.getItem(
        TOKEN_KEY
      );


    if (
      token &&
      token.trim()
    ) {
      return token;
    }
  }


  return null;
}



/* =========================================================
   USER
   ========================================================= */


export function getStoredUser(): any | null {

  const storages =
    getStorages();


  for (
    const storage of storages
  ) {

    const user =
      storage.getItem(
        USER_KEY
      );


    if(user){

      try {

        return JSON.parse(
          user
        );

      }
      catch {

        return null;

      }

    }

  }


  return null;
}



/* =========================================================
   ROLE
   ========================================================= */


export function getStoredRole(): string | null {


  const user =
    getStoredUser();


  if(
    user?.role?.roleName
  ){
    return user.role.roleName;
  }


  if(
    user?.roleName
  ){
    return user.roleName;
  }



  const storages =
    getStorages();


  for(
    const storage of storages
  ){

    const role =
      storage.getItem(
        "streamforge_role"
      );


    if(role){
      return role;
    }

  }


  return null;

}



/* =========================================================
   SAVE AUTH
   ========================================================= */


export function saveAuth(
  token:string,
  user:any,
  remember:boolean = true
){


  if(
    typeof window === "undefined"
  ){
    return;
  }


  const storage =
    remember
    ? window.localStorage
    : window.sessionStorage;



  storage.setItem(
    TOKEN_KEY,
    token
  );


  storage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );


  if(user?.username){

    storage.setItem(
      "streamforge_username",
      user.username
    );

  }


  if(user?.email){

    storage.setItem(
      "streamforge_email",
      user.email
    );

  }



  if(user?.userId){

    storage.setItem(
      "streamforge_user_id",
      String(user.userId)
    );

  }



  const role =
    user?.role?.roleName ||
    user?.roleName;



  if(role){

    storage.setItem(
      "streamforge_role",
      role
    );

  }


}



/* =========================================================
   CLEAR AUTH
   ========================================================= */


export function clearAuthStorage(){


  if(
    typeof window === "undefined"
  ){
    return;
  }



  for(
    const storage of getStorages()
  ){

    for(
      const key of AUTH_KEYS
    ){

      storage.removeItem(
        key
      );

    }

  }

}



/* =========================================================
   AUTH CHECK
   ========================================================= */


export function isAuthenticated(){

  return Boolean(
    getToken()
  );

}



/* =========================================================
   EVENT
   ========================================================= */


export function notifyAuthChanged(){


  if(
    typeof window === "undefined"
  ){
    return;
  }


  window.dispatchEvent(
    new Event(
      "streamforge:auth-changed"
    )
  );

}



/* =========================================================
   LOGOUT
   ========================================================= */


export function logout(){

  clearAuthStorage();

  notifyAuthChanged();


  if(
    typeof window !== "undefined"
  ){

    window.location.href =
      "/login";

  }

}