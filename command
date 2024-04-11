#First make the certcert.pem and certkey.pem with openssl
#then run daphne on a separated terminal, and Django in another

#Start redis server
docker-compose up

daphne -e ssl:8000:privateKey=certkey.pem:certKey=certcert.pem django_progect.asgi:application


#Puoi anche utilizzare soltanto questo:
python manage.py runsslserver --certificate ./certcert.pem --key ./certkey.pem 0.0.0.0:8001

TRUE:
POST /rooms/create/ HTTP/1.1
Host: 127.0.0.1:8001
User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: https://127.0.0.1:8001/dashboard
Content-Type: application/json
X-CSRFToken: null
Content-Length: 15
Origin: https://127.0.0.1:8001
Connection: keep-alive
Cookie: csrftoken=iQtA18I3EREBChsQBconpj86PNd00SYQ; sessionid=cqvttwfhm4t73r0hly3alytoa4hek1vn
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Pragma: no-cache
Cache-Control: no-cache

POST /rooms/create/ HTTP/1.1
Host: 127.0.0.1:8001
User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: https://127.0.0.1:8001/dashboard
Content-Type: application/json
X-CSRFToken: iQtA18I3EREBChsQBconpj86PNd00SYQ
Content-Length: 18
Origin: https://127.0.0.1:8001
Connection: keep-alive
Cookie: csrftoken=iQtA18I3EREBChsQBconpj86PNd00SYQ; sessionid=cqvttwfhm4t73r0hly3alytoa4hek1vn
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Pragma: no-cache
Cache-Control: no-cache