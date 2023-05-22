---
editLink: false
---

[API 参考](../index.md) / NavigationFailureType

# 枚举：NavigationFailureType %{#enumeration-navigationfailuretype}%

为导航失败枚举所有可能的类型。可以传入 [isNavigationFailure](../index.md#isnavigationfailure) 以检查特定的失败情况。

## 枚举成员 %{#Enumeration-Members}%

### aborted %{#Enumeration-Members-aborted}%

• **aborted** = ``4``

中断的导航是因为导航守卫返回 `false` 会调用了 `next(false)` 而导致失败的导航。

___

### cancelled %{#Enumeration-Members-cancelled}%

• **cancelled** = ``8``

取消的导航是因为另一个更近的导航已经开始 (不需要完成) 而导致失败的导航。

___

### duplicated %{#Enumeration-Members-duplicated}%

• **duplicated** = ``16``

重复的导航是因为其开始的时候已经处在相同的路径而导致失败的导航。
