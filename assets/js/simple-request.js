function requestPOST($http, func, data, success, failed){
    request('POST',$http, func, data, success, failed);
}

function requestGET($http, func, success, failed){
    request('GET',$http, func, null, success, failed);
}

function request(method, $http, func, data, success, failed){
    var url = func;
    if(func.indexOf('/')!=0){
        url = ROUTE + func;
    } else {
        url = '//' + window.location.host +  func;
    }

    console.log(func.indexOf('/'), window.location.host, url);



    $http({
        method: method,
        url: url,
        data: data}).
        success(function(data, status, headers, config) {
            console.log('request',data, status,headers,config);
            if(success){
                var response = data;

                if(data.response){
                    response = data.response;
                } else {
                    alert('no response field!');
                }

                success(response, status);
            }

        }).
        error(function(data, status, headers, config) {
            console.log(data, status);
            var errorMessage = data;
            if(data.error && data.error.detail){
                errorMessage = data.error.detail;
            } else if(data.error){
                errorMessage = data.error;
            }

            alert('Error:' + errorMessage);
            if(failed){
                failed(data, status);
            }

        });

}

(function(f,b){if(!b.__SV){var a,e,i,g;window.mixpanel=b;b._i=[];b.init=function(a,e,d){function f(b,h){var a=h.split(".");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}var c=b;"undefined"!==typeof d?c=b[d]=[]:d="mixpanel";c.people=c.people||[];c.toString=function(b){var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};c.people.toString=function(){return c.toString(1)+".people (stub)"};i="disable track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config people.set people.set_once people.increment people.append people.track_charge people.clear_charges people.delete_user".split(" ");
for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};b.__SV=1.2;a=f.createElement("script");a.type="text/javascript";a.async=!0;a.src="//cdn.mxpnl.com/libs/mixpanel-2.2.min.js";e=f.getElementsByTagName("script")[0];e.parentNode.insertBefore(a,e)}})(document,window.mixpanel||[]);
mixpanel.init("9b4fa505a5d50bdef461ba4e87ec54da");