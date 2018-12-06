module.exports = {
    isOnwer: function(request, response) {
        if(request.user) {
            return true;
        } else {
            return false;
        }
    },
    statusUI: function(request, response) {
        var authStatusUI = `
            <a href="/auth/login">login</a> | 
            <a href="/auth/register">Register</a> |
            <a href="/auth/google">Login with google</a> |
            <a href="/auth/facebook">Login with facebook</a>`;
        if(this.isOnwer(request, response)) {
            authStatusUI = `${request.user.displayName} | <a href="/auth/logout">logout</a>`;
        }
        return authStatusUI;
    }
}