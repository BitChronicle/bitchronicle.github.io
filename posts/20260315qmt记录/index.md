# 量化持仓日志 - 2026-03-13


## 盈亏汇总

| 指标 | 金额/点数 | 收益率 |
|------|-----------|--------|
| **当日盈亏** | <span style="color: red;">+13.00 元</span> | <span style="color: red;">+0.03%</span> |
| **当日大盘** | <span style="color: green;">-33.65 点</span> | <span style="color: green;">-0.81%</span> |
| **累计盈亏** | <span style="color: green;">-283.44 元</span> | <span style="color: green;">-0.71%</span> |
| **大盘累计** | <span style="color: green;">-37.75 点</span> | <span style="color: green;">-0.91%</span> |

> 大盘基准：3月12日开盘价 4133.20 点

## 数据汇总

### 资金状况
- **现金余额**: 1,204.56 元
- **股票市值**: 38,512.00 元
- **当前资产**: 39,716.56 元
- **初始资金**: 40,000.00 元

### 大盘走势
- **当日大盘**: 4117.57 点 → 4095.45 点（<span style="color: green;">-33.65 点</span>）

## 收益曲线

{{< echarts >}}
{
  "title": {
    "text": "收益曲线",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis",
    "axisPointer": {
      "type": "cross"
    }
  },
  "legend": {
    "data": [
      "策略收益",
      "基准收益"
    ],
    "bottom": 0
  },
  "grid": {
    "left": "10%",
    "right": "10%",
    "bottom": "20%",
    "containLabel": true
  },
  "xAxis": {
    "type": "category",
    "boundaryGap": false,
    "data": [
      "2026-03-11",
      "2026-03-12",
      "2026-03-13"
    ],
    "axisLabel": {
      "rotate": 45
    }
  },
  "yAxis": {
    "type": "value",
    "name": "收益率(%)",
    "axisLabel": {
      "formatter": "{value}%"
    },
    "splitLine": {
      "show": true
    }
  },
  "dataZoom": [
    {
      "type": "slider",
      "show": true,
      "start": 80,
      "end": 100,
      "bottom": "5%"
    },
    {
      "type": "inside",
      "start": 80,
      "end": 100
    }
  ],
  "series": [
    {
      "name": "策略收益",
      "type": "line",
      "data": [
        0.0,
        -0.74,
        -0.71
      ],
      "smooth": true,
      "lineStyle": {
        "color": "#5470c6",
        "width": 3
      },
      "itemStyle": {
        "color": "#5470c6"
      }
    },
    {
      "name": "基准收益",
      "type": "line",
      "data": [
        0.0,
        -0.1,
        -0.91
      ],
      "smooth": true,
      "lineStyle": {
        "color": "#ee6666",
        "width": 2,
        "type": "dashed"
      },
      "itemStyle": {
        "color": "#ee6666"
      }
    }
  ]
}
{{< /echarts >}}

---

*数据更新时间: 2026-03-15 09:27:30*


---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/20260315qmt%E8%AE%B0%E5%BD%95/  

