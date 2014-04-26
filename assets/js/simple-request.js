function requestPOST($http, func, data, success, failed){
    request('POST',$http, func, data, success, failed);
}

function requestGET($http, func, success, failed){
    request('GET',$http, func, null, success, failed);
}

function request(method, $http, func, data, success, failed){




    $http({
        method: method,
        url: ROUTE + func,
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