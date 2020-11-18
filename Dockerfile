FROM python:alpine

LABEL maintainer="Dennis Lee <dennislwm@gmail.com>"

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir youtube_dl

COPY ./youtube-dl.conf /etc/youtube-dl.conf

WORKDIR /media

# 
# Override default ENTRYPOINT by passing the entrypoint to Docker. For example:
# $ docker run myimage youtube-dl --param1
#
# Note that a docker container persists after it exited, hence this allows you to 
# run the container again. However, if you want to delete immediately after it exits:
# $ docker run --rm myimage youtube-dl --param1
ENTRYPOINT ["youtube-dl"]

#
# CMD consists of parameters to ENTRYPOINT
CMD ["--version"]
