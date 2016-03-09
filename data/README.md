v2.0本意是进行数据上的优化。但是由于数据量很大，存储方式由原先的写在代码中，变为在文件中，因此不得不采用异步方式，这样原先的代码绝大部分都不能使用了。


主要进行了以下几个步骤的工作：
+ 从网络上抓取大量诗词数据
+ 按格式将诗词分类
+ 对诗词正文进行分词操作
+ 统计各词出现的频率
+ 统计五言、七言诗句的句型，并将高频句型作为模板保存。
+ 根据参数或者随机挑选模板，然后使用词库渲染之。

##1、 抓取诗词
首先选定了 http://so.gushiwen.org/ 这个网站作为抓取的目标，这个网站上收录的诗词数量也很可观，词也基本都是主流诗人写的，是很好的数据源。总共抓取了71000首。

观察发现，所有诗歌的正文都在形如http://so.gushiwen.org/view_XXX.aspx的网页上（XXX是数字），这大大简化了抓取操作。

具体抓取和解析代码在「poem-spider.js」中。最后解析出来的结果被保存在「docs/poems.txt」中。

##2、 分类
这一步采用了正则表达式匹配诗文，将五言、七言诗等分开保存。
具体代码在「poem-selector.js」中。目前解析了七言诗和五言诗，保存在「docs/QiYan.txt」和「docs/WuYan.txt」中

##3、 分词
为了实现词语频率的统计，以及后续词性的分析，首先要进行的是分词操作。
找到了这样一个分词工具：http://thulac.thunlp.org/demo。
下载得到了两个部分的文件：
```
THULAC_lite_java_run.jar
models/
```
jar文件是进行分词的可执行文件，models文件夹包含一些官方提供的训练数据，用以执行分词操作。
针对唐诗，分词效果其实还有提升的空间，比如说下面这样的：
```
神皋福 地 三 秦邑 ， 玉台 金阙九仙家 。 寒光 犹恋 甘泉树 ， 淑景 偏 临建 始 花 。
```
其中金阙九仙家应该可以被分词为金阙/九仙/家。但是这些词对人来说已经比较难懂了，估计不容易通过训练得到改善。不过好在后面的统计操作，基本能够把这些无意义的分词筛掉。

分词时的命令很简单：
```bash
$> java -jar thulac\\thulac.jar -seg_only -input data\\WuYan.txt -output data\\Separate_WuYan.txt
```
具体代码在「poem-separate.js」中。
##4、 统计词频
使用字典显然是统计词频的最好的选择。
每读取到一个词就在字典中创建这个条目，或者将这个词的计数增加1。
具体的代码在「high-freq-word.js」中，最后筛选出了所有出现大于1次的词语，结果保存在「docs/high-frequency-word.csv」中。

光光统计高频词语是显然不够的，还需要保存词语相应的信息。
根据之前的思路，需要保存的信息包括：
+ 字数
+ 平仄
+ 词性
+ （韵脚）

因此大体上将词以csv的格式保存在`A/[平仄]/[词性]/[字数]`(如果不需要押韵)或`B/[平仄]/[韵脚]/[词性]/[字数]`(如果需要押韵)的文件中。 。
韵脚和平仄怎么办？！求助万能的github，发现这样一个前辈写好的js库：https://github.com/hotoo/pinyin 。
##5、统计模板
继续求助上文的分词工具，生成形如`[词性][字数]([是否押韵])/...`这样的模板。
比如：
```
自从关路入秦川，争道何人不戏鞭。
```
将会被分词为：
```
 自从_p 关路_n 入_v 秦川_ns ，_w 争道_v 何人_r 不_d 戏鞭_v 。
```
进而，其句型信息为：
```
['p2/n2/n1/ns2/', 'v2/r2/d1/v2/']
```
注：由于一些词性，例如`ns`、`ni`等，都属于同一范畴，可以将他们都合并到名词。因此在分词和保存模板的时候，将许多词性进行了合并。
当然了，除了句型信息，还要有平仄信息。由于平仄与句型并没有直接的关联（在绝句中），因此将句型和平仄分两部分保存。
查阅了一下绝句的平仄规律，以及拗句的情况等等。。最后讲平仄模板写在了代码中。预计有30+个不同的模板。
最后模板信息保存在「word/WuYan_templates.txt」和「word/QiYan_templates.txt」中。

##6、渲染
渲染就是简单的用生日取当前模板或词库文件的模，得到序号。
大功告成。。。。。。。。。。。。。。。。。。。。。。。。。。
。
。
。
too naive.
实际渲染的时候，常常会出现死循环的情况。于是打印出了出现死循环情况的模板信息：发现一个共同点，模板信息中都会出现`id7/`、`id5/`等类型的单元，这种超长的词法单元是由于词法分析工具没有正确的分词造成的。因此，痛下杀手，将所有带有`id`以及包含字数大于3的词法单元的模板全部剔除。这一下不得了，剔除了大约60%的模板。可见，在诗词方面，thulac的分词工具还有很大的提升空间。

好了，这下再也没有出现过死循环的情况。

#7、优化
生成多首诗的时候，会出现每首词都需要可观的时间。分析后得出诊断，应该是读取文件的耗时。于是使用单例模式，在第一次访问某个文件时将这个文件的内容加载到一个字典中，下次直接从字典中读取。经过测试，后续的词生成速度很快。

随便贴首词出来：
```
[ '争心酒欢无近信', '淮北山围摆震雷', '沦迹兰芽垒潏潏', '兼仆潏潏蹭白眉' ]
[ '吊影自蹉跎', '防知静近郭', '暨滴昏朔雾', '起望自蹉跎' ]

```
咦！居然有重复的词！
原来，在挑选词的时候，简单的根据生日信息取模来取词，一旦遇到两个一样的词法单元，比如`n2/`，平仄信息都是`+-`，那么取出的词一定是一样的。于是乎，在遍历模板的时候，每次将生日增加10.大大减少了重复的概率。

来首优化后的词吧，意境还是有的：
```
寒宵月生筹政事，
韶濩秦关百岸风。
哲匠公堂美利戒，
文学魏帝断弦声。
```