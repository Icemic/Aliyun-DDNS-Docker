# 将阿里云解析用于 DDNS

![](http://www.wtfpl.net/wp-content/uploads/2012/12/wtfpl-badge-2.png)

将家庭本地的服务器解析到特定的二级域名
镜像地址：[icemic/aliyun-ddns](https://hub.docker.com/r/icemic/aliyun-ddns/)

## 使用要求

- 具有公网IP
- 路由器等已设置 DMZ 或端口转发指向服务器内网地址

## 使用方法

以任何你喜欢的方式运行 Docker 镜像，并设置如下必需的环境变量
- AccessKeyId: 阿里云的accesskey，可使用子账户（需要阿里云解析权限）
- AccessKeySecret: 对应的secret
- Domain: 要被设置的域名，如 example.com
- SubDomain: 子域名，如 foo
- TTL: _(可选)_，检查间隔（毫秒），默认为 5 分钟

运行后控制台会输出相关日志

## License
WTFPL