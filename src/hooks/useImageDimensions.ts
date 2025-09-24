import { useState, useEffect } from "react";
import {
  getImageDimensions,
  ImageDimensions,
  ImageDimensionsResult,
} from "../utils/imageDimensions";

/**
 * 获取图片尺寸的Hook
 * @param imageSource - 图片源
 * @param autoLoad - 是否自动加载 (默认true)
 * @returns ImageDimensionsResult
 */
export const useImageDimensions = (
  imageSource: any,
  autoLoad: boolean = true,
): ImageDimensionsResult => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDimensions = async () => {
    if (!imageSource) {
      setError("图片源不能为空");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getImageDimensions(imageSource);
      setDimensions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取图片尺寸失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && imageSource) {
      loadDimensions();
    }
  }, [imageSource, autoLoad]);

  return {
    dimensions,
    loading,
    error,
  };
};

/**
 * 批量获取图片尺寸的Hook
 * @param imageSources - 图片源数组
 * @param autoLoad - 是否自动加载 (默认true)
 * @returns 包含所有图片尺寸信息的结果
 */
export const useMultipleImageDimensions = (
  imageSources: any[],
  autoLoad: boolean = true,
) => {
  const [dimensions, setDimensions] = useState<ImageDimensions[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDimensions = async () => {
    if (!imageSources || imageSources.length === 0) {
      setError("图片源数组不能为空");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        imageSources.map((source) => getImageDimensions(source)),
      );
      setDimensions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "批量获取图片尺寸失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && imageSources && imageSources.length > 0) {
      loadDimensions();
    }
  }, [imageSources, autoLoad]);

  return {
    dimensions,
    loading,
    error,
    reload: loadDimensions,
  };
};
