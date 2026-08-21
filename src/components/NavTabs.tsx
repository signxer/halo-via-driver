import React, {useLayoutEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {NavLink, useLocation} from 'react-router-dom';
import {navLabels} from '../i18n';
import tabLeft from '../assets/nuphy/tabLeft.svg?url';
import tabRight from '../assets/nuphy/tabRight.svg?url';

// ============================================================
// 原版 tab 导航(selectDevice=5 实测)
// .tabTop > .leftTab > li.selectedLi / li.pointer > p
// 选中/未选: 0.875rem fw900；li padding 0 1.25rem，无下划线
// ============================================================

const TabTopBac = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 112.5rem; /* 1000px */
  margin: 0 auto;
  position: relative;
  z-index: 11;
  transform: translateY(-5px);
  /* 原版 activeSlidingBac 会裁切首个 Tab 向左外扩的连接层，
     因而第一个 Tab 左边是垂直边，后续 Tab 才显示完整曲线。 */
  overflow: hidden;
`;

const ActiveSliding = styled.div`
  position: absolute;
  /* 原版 activeSliding 的实际高度是 C.K(24)，面板从它的底边开始。 */
  top: 0;
  height: 1.875rem;
  display: flex;
  pointer-events: none;
  z-index: 0;
  transition: left .3s ease-in-out, width .3s ease-in-out;
  .tab-slide-left,
  .tab-slide-right {
    /* 原版 C.K(35)，不是 SVG viewBox 的 30px 高度。 */
    flex: 0 0 2.1875rem;
    width: 2.1875rem;
    height: 100%;
    background: var(--background-canvas-overlay);
    mask-size: 100% 100%;
    -webkit-mask-size: 100% 100%;
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
  }
  .tab-slide-left {
  }
  .tab-slide-right {
  }
  .tab-slide-middle {
    flex: 1 1 auto;
    height: 100%;
    background: var(--background-canvas-overlay);
  }
`;

const TabTop = styled.div`
  display: flex;
  align-items: center;
  height: 1.875rem;
`;

const LeftTab = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
`;

const TabItemLi = styled.li<{$active: boolean}>`
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0 1.25rem;
  cursor: pointer;
  position: relative;
  z-index: 1;
  white-space: nowrap;
  margin: 0;
  height: 1.875rem;
  color: ${(p) =>
    p.$active ? 'var(--text-primary)' : 'var(--text-secondary)'};
  background: transparent;
  height: 100%;

  &:hover {
    /* 黑色主题下不能继续使用黑色透明度，否则文字会和深色背景融在一起。 */
    color: var(--text-primary);
  }
`;

const TabP = styled.p<{$active: boolean}>`
  margin: 0;
  font-size: 0.875rem; /* 原版 7.78px */
  font-weight: 900;
  color: inherit;
  line-height: 1.15;
`;

const NavLinkStyled = styled(NavLink)`
  text-decoration: none;
  color: inherit;
  display: block;
`;

// 只保留当前 VIA/Halo65 已实现的页面；高级键、模式切换等功能没有对应
// 的 VIA 实现时不显示入口，避免出现“能打开但无法使用”的菜单。
const navItems = [
  {to: '/pressKey', label: navLabels.remap},
  {to: '/light', label: navLabels.color},
  {to: '/macro', label: navLabels.macro},
];

export const NavTabs: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const tabRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [slide, setSlide] = useState({left: 0, width: 0});

  useLayoutEffect(() => {
    const active = tabRefs.current[currentPath];
    if (!active) return;

    // 原版通过 DOM observer 在字体加载、窗口缩放后重新测量；否则
    // offsetWidth 可能在字体完成加载前多 1px，造成 active 背景过宽。
    const measure = () => {
      const current = tabRefs.current[currentPath];
      if (!current) return;
      setSlide({left: current.offsetLeft, width: current.offsetWidth});
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null;
    observer?.observe(active);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [currentPath]);

  return (
    <TabTopBac>
      <ActiveSliding
        aria-hidden="true"
        /* 原版使用 C.r(15) / C.r(30)，必须跟随根字号缩放，不能写死 px。 */
        style={{
          left: `calc(${slide.left}px - 0.9375rem)`,
          width: `calc(${slide.width}px + 1.875rem)`,
        }}
      >
        <span
          className="tab-slide-left"
          style={{
            maskImage: `url("${tabLeft}")`,
            WebkitMaskImage: `url("${tabLeft}")`,
          }}
        />
        <span className="tab-slide-middle" />
        <span
          className="tab-slide-right"
          style={{
            maskImage: `url("${tabRight}")`,
            WebkitMaskImage: `url("${tabRight}")`,
          }}
        />
      </ActiveSliding>
      <TabTop>
        <LeftTab>
          {navItems.map((item) => (
            <TabItemLi
              key={item.to}
              ref={(element) => { tabRefs.current[item.to] = element; }}
              className={currentPath === item.to ? 'selectedLi' : 'pointer'}
              $active={currentPath === item.to}
            >
              <NavLinkStyled to={item.to}>
                <TabP $active={currentPath === item.to}>{item.label}</TabP>
              </NavLinkStyled>
            </TabItemLi>
          ))}
        </LeftTab>
      </TabTop>
    </TabTopBac>
  );
};
